const router = require('express').Router();
const { query } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/enrollments/my - student's own enrollments
router.get('/my', authenticate, async (req, res) => {
  const result = await query(
    `SELECT e.*, c.name_vi, c.name_en, c.start_date, c.end_date, c.tuition_fee,
            c.location, c.schedule, c.thumbnail_url, c.category, c.language_type,
            p.status AS payment_status, p.method AS payment_method, p.paid_at
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN payments p ON p.enrollment_id = e.id AND p.status = 'completed'
     WHERE e.student_id = $1
     ORDER BY e.enrolled_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// POST /api/enrollments - student enrolls
router.post('/', authenticate, async (req, res) => {
  const { course_id } = req.body;
  if (!course_id) return res.status(400).json({ error: 'course_id required' });

  // Check course exists and has seats
  const courseResult = await query(
    'SELECT * FROM courses WHERE id = $1 AND is_active = TRUE',
    [course_id]
  );
  const course = courseResult.rows[0];
  if (!course) return res.status(404).json({ error: 'Khóa học không tồn tại' });
  if (course.current_students >= course.max_students) {
    return res.status(409).json({ error: 'Khóa học đã đủ sĩ số' });
  }

  // Check duplicate
  const existing = await query(
    'SELECT id, status FROM enrollments WHERE student_id = $1 AND course_id = $2',
    [req.user.id, course_id]
  );
  if (existing.rows[0]) {
    return res.status(409).json({ error: 'Bạn đã đăng ký khóa học này', enrollment: existing.rows[0] });
  }

  const result = await query(
    `INSERT INTO enrollments (student_id, course_id, status)
     VALUES ($1, $2, 'pending_payment') RETURNING *`,
    [req.user.id, course_id]
  );

  res.status(201).json({ enrollment: result.rows[0], course });
});

// GET /api/enrollments - admin: list all
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { course_id, status, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const where = [];
  let pi = 1;

  if (course_id) { where.push(`e.course_id = $${pi++}`); params.push(course_id); }
  if (status) { where.push(`e.status = $${pi++}`); params.push(status); }

  const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await query(
    `SELECT e.*,
            u.first_name || ' ' || u.last_name AS student_name,
            u.email AS student_email, u.id_number, u.student_code,
            c.name_vi AS course_name, c.code AS course_code,
            p.status AS payment_status, p.method AS payment_method, p.amount AS payment_amount, p.paid_at
     FROM enrollments e
     JOIN users u ON u.id = e.student_id
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN payments p ON p.enrollment_id = e.id AND p.status = 'completed'
     ${wc}
     ORDER BY e.enrolled_at DESC
     LIMIT $${pi} OFFSET $${pi + 1}`,
    [...params, parseInt(limit), offset]
  );

  const count = await query(`SELECT COUNT(*) FROM enrollments e ${wc}`, params);
  res.json({ data: result.rows, total: parseInt(count.rows[0].count) });
});

// PATCH /api/enrollments/:id/confirm - admin confirms enrollment
router.patch('/:id/confirm', authenticate, requireAdmin, async (req, res) => {
  const result = await query(
    `UPDATE enrollments SET status = 'confirmed', confirmed_at = NOW(), confirmed_by = $1
     WHERE id = $2 RETURNING *`,
    [req.user.id, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Enrollment not found' });
  res.json(result.rows[0]);
});

// PATCH /api/enrollments/:id/cancel
router.patch('/:id/cancel', authenticate, async (req, res) => {
  const result = await query('SELECT * FROM enrollments WHERE id = $1', [req.params.id]);
  const enrollment = result.rows[0];
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  const isOwner = enrollment.student_id === req.user.id;
  const isAdmin = ['super_admin', 'staff'].includes(req.user.role);
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const updated = await query(
    `UPDATE enrollments SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $1
     WHERE id = $2 RETURNING *`,
    [req.user.id, req.params.id]
  );
  res.json(updated.rows[0]);
});

module.exports = router;
