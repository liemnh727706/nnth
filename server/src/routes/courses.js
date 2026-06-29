const router = require('express').Router();
const { body, query: qv, validationResult } = require('express-validator');
const { query } = require('../utils/db');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const upload = multer({
  dest: 'uploads/courses/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// GET /api/courses - public list
router.get('/', [
  qv('category').optional().isIn(['foreign_language', 'informatics']),
  qv('language').optional(),
  qv('page').optional().isInt({ min: 1 }),
  qv('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res) => {
  const { category, language, search, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ['c.is_active = TRUE'];
  const params = [];
  let pi = 1;

  if (category) { where.push(`c.category = $${pi++}`); params.push(category); }
  if (language) { where.push(`c.language_type = $${pi++}`); params.push(language); }
  if (search) {
    where.push(`(unaccent(c.name_vi) ILIKE unaccent($${pi}) OR unaccent(c.name_en) ILIKE unaccent($${pi}))`);
    params.push(`%${search}%`); pi++;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [coursesResult, countResult] = await Promise.all([
    query(
      `SELECT c.*, (c.max_students - c.current_students) AS seats_available
       FROM courses c ${whereClause}
       ORDER BY c.start_date ASC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, parseInt(limit), offset]
    ),
    query(`SELECT COUNT(*) FROM courses c ${whereClause}`, params),
  ]);

  res.json({
    data: coursesResult.rows,
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

// GET /api/courses/:id
router.get('/:id', async (req, res) => {
  const result = await query(
    `SELECT c.*, (c.max_students - c.current_students) AS seats_available,
            u.first_name || ' ' || u.last_name AS created_by_name
     FROM courses c
     LEFT JOIN users u ON u.id = c.created_by
     WHERE c.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Khóa học không tìm thấy' });
  res.json(result.rows[0]);
});

// POST /api/courses - admin only
router.post('/', authenticate, requireAdmin, upload.single('thumbnail'), [
  body('code').trim().notEmpty(),
  body('name_vi').trim().notEmpty(),
  body('name_en').trim().notEmpty(),
  body('category').isIn(['foreign_language', 'informatics']),
  body('tuition_fee').isNumeric(),
  body('max_students').isInt({ min: 1 }),
  body('start_date').isDate(),
  body('end_date').isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    code, name_vi, name_en, description_vi, description_en, category, language_type,
    level, duration_hours, tuition_fee, max_students, instructor_name, location,
    start_date, end_date, schedule,
  } = req.body;

  const thumbnail_url = req.file ? `/uploads/courses/${req.file.filename}` : null;

  const result = await query(
    `INSERT INTO courses (code, name_vi, name_en, description_vi, description_en, category, language_type,
      level, duration_hours, tuition_fee, max_students, instructor_name, location, start_date, end_date,
      schedule, thumbnail_url, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
    [code, name_vi, name_en, description_vi, description_en, category, language_type || null,
     level, duration_hours, tuition_fee, max_students, instructor_name, location,
     start_date, end_date, schedule, thumbnail_url, req.user.id]
  );

  res.status(201).json(result.rows[0]);
});

// PUT /api/courses/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const fields = ['name_vi', 'name_en', 'description_vi', 'description_en', 'tuition_fee',
                  'max_students', 'instructor_name', 'location', 'start_date', 'end_date',
                  'schedule', 'is_active', 'level'];
  const updates = [];
  const params = [];
  let pi = 1;

  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = $${pi++}`);
      params.push(req.body[f]);
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);
  const result = await query(
    `UPDATE courses SET ${updates.join(', ')} WHERE id = $${pi} RETURNING *`,
    params
  );

  if (!result.rows[0]) return res.status(404).json({ error: 'Khóa học không tìm thấy' });
  res.json(result.rows[0]);
});

// DELETE /api/courses/:id - super admin only
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  const enroll = await query('SELECT id FROM enrollments WHERE course_id = $1 LIMIT 1', [req.params.id]);
  if (enroll.rows.length > 0) {
    return res.status(409).json({ error: 'Không thể xóa khóa học đã có sinh viên đăng ký' });
  }
  await query('UPDATE courses SET is_active = FALSE WHERE id = $1', [req.params.id]);
  res.json({ message: 'Đã ẩn khóa học' });
});

module.exports = router;
