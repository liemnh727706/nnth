const router = require('express').Router();
const { query } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/announcements - public
router.get('/', async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const where = ['a.published_at IS NOT NULL', 'a.published_at <= NOW()'];
  let pi = 1;

  if (category) { where.push(`a.category = $${pi++}`); params.push(category); }

  const wc = `WHERE ${where.join(' AND ')}`;

  const result = await query(
    `SELECT a.*, u.first_name || ' ' || u.last_name AS author, c.name_vi AS course_name
     FROM announcements a
     JOIN users u ON u.id = a.created_by
     LEFT JOIN courses c ON c.id = a.course_id
     ${wc}
     ORDER BY a.is_pinned DESC, a.published_at DESC
     LIMIT $${pi} OFFSET $${pi + 1}`,
    [...params, parseInt(limit), offset]
  );

  res.json(result.rows);
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

// POST /api/announcements - admin
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { title_vi, title_en, content_vi, content_en, category, course_id, is_pinned, publish_now } = req.body;

  const result = await query(
    `INSERT INTO announcements (title_vi, title_en, content_vi, content_en, category, course_id, is_pinned, published_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [title_vi, title_en || null, content_vi, content_en || null, category || 'general',
     course_id || null, is_pinned || false, publish_now ? new Date() : null, req.user.id]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/announcements/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { title_vi, title_en, content_vi, content_en, is_pinned, published_at } = req.body;
  const result = await query(
    `UPDATE announcements SET title_vi=$1, title_en=$2, content_vi=$3, content_en=$4, is_pinned=$5, published_at=$6
     WHERE id=$7 RETURNING *`,
    [title_vi, title_en, content_vi, content_en, is_pinned, published_at, req.params.id]
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
