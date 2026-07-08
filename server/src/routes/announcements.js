const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { query } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

fs.mkdirSync('uploads/announcements', { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/announcements/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

// Chuyển req.files thành mảng attachments [{url, name, type}]
const filesToAttachments = (files = []) => files.map(f => ({
  url: `/uploads/announcements/${f.filename}`,
  name: Buffer.from(f.originalname, 'latin1').toString('utf8'), // giữ đúng tên tiếng Việt
  type: path.extname(f.originalname).toLowerCase() === '.pdf' ? 'pdf' : 'image',
}));

// GET /api/announcements - public
router.get('/', async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const where = ['a.published_at IS NOT NULL', 'a.published_at <= NOW()'];
  let pi = 1;

  if (category) { where.push(`a.category = $${pi++}`); params.push(category); }

  const wc = `WHERE ${where.join(' AND ')}`;

  const [result, countResult] = await Promise.all([
    query(
      `SELECT a.*, u.first_name || ' ' || u.last_name AS author, c.name_vi AS course_name
       FROM announcements a
       JOIN users u ON u.id = a.created_by
       LEFT JOIN courses c ON c.id = a.course_id
       ${wc}
       ORDER BY a.is_pinned DESC, a.published_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, parseInt(limit), offset]
    ),
    query(`SELECT COUNT(*) FROM announcements a ${wc}`, params),
  ]);

  res.json({ data: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/announcements/:id
router.get('/:id', async (req, res) => {
  const result = await query(
    `SELECT a.*, u.first_name || ' ' || u.last_name AS author
     FROM announcements a JOIN users u ON u.id = a.created_by
     WHERE a.id = $1 AND a.published_at IS NOT NULL`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// POST /api/announcements - admin (multipart: fields + files[])
router.post('/', authenticate, requireAdmin, upload.array('files', 5), async (req, res) => {
  const { title_vi, title_en, content_vi, content_en, category, course_id, is_pinned, publish_now } = req.body;
  const attachments = filesToAttachments(req.files);

  const result = await query(
    `INSERT INTO announcements (title_vi, title_en, content_vi, content_en, category, course_id, is_pinned, published_at, created_by, attachments)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [title_vi, title_en || null, content_vi, content_en || null, category || 'general',
     course_id || null, is_pinned === 'true' || is_pinned === true,
     (publish_now === 'true' || publish_now === true) ? new Date() : null, req.user.id,
     JSON.stringify(attachments)]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/announcements/:id — giữ file cũ (existing_attachments JSON) + thêm file mới
router.put('/:id', authenticate, requireAdmin, upload.array('files', 5), async (req, res) => {
  const { title_vi, title_en, content_vi, content_en, is_pinned, published_at, existing_attachments } = req.body;

  let attachments = [];
  try { attachments = JSON.parse(existing_attachments || '[]'); } catch { attachments = []; }
  attachments = [...attachments, ...filesToAttachments(req.files)].slice(0, 5);

  const result = await query(
    `UPDATE announcements SET title_vi=$1, title_en=$2, content_vi=$3, content_en=$4, is_pinned=$5, published_at=$6, attachments=$7
     WHERE id=$8 RETURNING *`,
    [title_vi, title_en || null, content_vi, content_en || null,
     is_pinned === 'true' || is_pinned === true, published_at || new Date(),
     JSON.stringify(attachments), req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  await query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
