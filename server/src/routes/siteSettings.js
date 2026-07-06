const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

fs.mkdirSync('uploads/site', { recursive: true });
const { query } = require('../utils/db');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/site/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

// GET /api/site-settings — public, client tải về để ghi đè mặc định
router.get('/', async (req, res) => {
  const result = await query('SELECT content, updated_at FROM site_settings WHERE id = 1');
  res.json(result.rows[0]?.content || {});
});

// PUT /api/site-settings — super admin cập nhật nội dung
router.put('/', authenticate, requireSuperAdmin, async (req, res) => {
  const content = req.body;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return res.status(400).json({ error: 'Nội dung không hợp lệ' });
  }

  const result = await query(
    `INSERT INTO site_settings (id, content, updated_by, updated_at)
     VALUES (1, $1, $2, NOW())
     ON CONFLICT (id) DO UPDATE SET content = $1, updated_by = $2, updated_at = NOW()
     RETURNING content, updated_at`,
    [JSON.stringify(content), req.user.id]
  );
  res.json(result.rows[0]);
});

// POST /api/site-settings/upload — upload ảnh minh họa, trả về URL
router.post('/upload', authenticate, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Chưa chọn file ảnh hợp lệ (.jpg .png .webp .svg .gif, tối đa 5MB)' });
  res.status(201).json({ url: `/uploads/site/${req.file.filename}` });
});

module.exports = router;
