const router = require('express').Router();
const XLSX = require('xlsx');
const { query } = require('../utils/db');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

// GET /api/admin/dashboard
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  const [students, courses, enrollments, revenue] = await Promise.all([
    query('SELECT COUNT(*) FROM users WHERE role = \'student\''),
    query('SELECT COUNT(*) FROM courses WHERE is_active = TRUE'),
    query('SELECT COUNT(*), status FROM enrollments GROUP BY status'),
    query('SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = \'completed\''),
  ]);

  res.json({
    total_students: parseInt(students.rows[0].count),
    active_courses: parseInt(courses.rows[0].count),
    enrollments_by_status: enrollments.rows,
    total_revenue: parseInt(revenue.rows[0].total),
  });
});

// GET /api/admin/export/enrollments - export to Excel
router.get('/export/enrollments', authenticate, requireAdmin, async (req, res) => {
  const { course_id } = req.query;
  const params = course_id ? [course_id] : [];
  const where = course_id ? 'WHERE e.course_id = $1' : '';

  const result = await query(
    `SELECT
        u.last_name || ' ' || u.first_name AS "Họ và tên",
        u.id_number AS "Số CCCD",
        u.student_code AS "Mã sinh viên",
        u.email AS "Email",
        c.code AS "Mã khóa học",
        c.name_vi AS "Tên khóa học",
        c.tuition_fee AS "Học phí",
        e.status AS "Trạng thái đăng ký",
        p.method AS "Phương thức thanh toán",
        p.status AS "Trạng thái TT",
        p.paid_at AS "Ngày thanh toán",
        e.enrolled_at AS "Ngày đăng ký"
     FROM enrollments e
     JOIN users u ON u.id = e.student_id
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN payments p ON p.enrollment_id = e.id AND p.status = 'completed'
     ${where}
     ORDER BY c.code, u.last_name`,
    params
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(result.rows);

  // Column widths
  ws['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
    { wch: 15 }, { wch: 35 }, { wch: 12 }, { wch: 20 },
    { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách ghi danh');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="danhsach-ghedanh-${Date.now()}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// GET /api/admin/users - list users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const { page = 1, limit = 50, search, role } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where = [];
  const params = [];
  let pi = 1;

  if (search) {
    where.push(`(unaccent(u.first_name || ' ' || u.last_name) ILIKE unaccent($${pi}) OR u.email ILIKE $${pi} OR u.id_number ILIKE $${pi})`);
    params.push(`%${search}%`); pi++;
  }
  if (role) { where.push(`u.role = $${pi++}`); params.push(role); }

  const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.id_number, u.student_code,
            u.role, u.email_verified, u.is_active, u.created_at
     FROM users u ${wc}
     ORDER BY u.created_at DESC
     LIMIT $${pi} OFFSET $${pi + 1}`,
    [...params, parseInt(limit), offset]
  );

  const count = await query(`SELECT COUNT(*) FROM users u ${wc}`, params);
  res.json({ data: result.rows, total: parseInt(count.rows[0].count) });
});

// PATCH /api/admin/users/:id/toggle-active - super admin only
router.patch('/users/:id/toggle-active', authenticate, requireSuperAdmin, async (req, res) => {
  const result = await query(
    'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, email, is_active',
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// POST /api/admin/users - create staff account (super admin only)
router.post('/users', authenticate, requireSuperAdmin, async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { email, password, first_name, last_name, id_number, role = 'staff' } = req.body;

  if (!['staff', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, id_number, role, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id, email, role`,
    [email, hash, first_name, last_name, id_number, role]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
