const router = require('express').Router();
const XLSX = require('xlsx');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { query } = require('../utils/db');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

const excelUpload = multer({ dest: 'uploads/user-imports/', limits: { fileSize: 10 * 1024 * 1024 } });

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

// GET /api/admin/users/template - file Excel mẫu tạo account hàng loạt
router.get('/users/template', authenticate, requireSuperAdmin, (req, res) => {
  const headers = ['Email', 'Họ', 'Tên', 'CCCD', 'MSSV', 'Ngày sinh', 'Nơi sinh', 'Điện thoại', 'Vai trò', 'Mật khẩu'];
  const example = ['20130001@st.hcmuaf.edu.vn', 'Nguyễn Văn', 'An', '079203001234', '20130001', '15/03/2003', 'TP.HCM', '0901234567', 'student', ''];
  const note = ['Vai trò: student hoặc staff. Mật khẩu bỏ trống sẽ tự đặt là Nnth@ + CCCD.', '', '', '', '', '', '', '', '', ''];

  const ws = XLSX.utils.aoa_to_sheet([headers, example, note]);
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'TaiKhoan');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="mau-tao-tai-khoan.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// POST /api/admin/users/import - tạo account hàng loạt từ Excel (super admin only)
router.post('/users/import', authenticate, requireSuperAdmin, excelUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Chưa chọn file' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    return res.status(400).json({ error: 'Chỉ hỗ trợ file Excel (.xlsx, .xls, .csv)' });
  }

  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const created = [];
  const errors = [];

  // Chuyển 'dd/mm/yyyy' hoặc Excel serial date về yyyy-mm-dd
  const parseDob = (v) => {
    if (!v) return null;
    if (typeof v === 'number') {
      const d = XLSX.SSF.parse_date_code(v);
      return d ? `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : null;
    }
    const m = String(v).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return String(v).match(/^\d{4}-\d{2}-\d{2}$/) ? v : null;
  };

  for (const row of rows) {
    const email = String(row['Email'] || '').trim().toLowerCase();
    const lastName = String(row['Họ'] || '').trim();
    const firstName = String(row['Tên'] || '').trim();
    const idNumber = String(row['CCCD'] || '').trim();
    const studentCode = String(row['MSSV'] || '').trim();
    const dob = parseDob(row['Ngày sinh']);
    const pob = String(row['Nơi sinh'] || '').trim();
    const phone = String(row['Điện thoại'] || '').trim();
    const role = String(row['Vai trò'] || 'student').trim().toLowerCase();
    let password = String(row['Mật khẩu'] || '').trim();

    // Bỏ qua dòng ghi chú của file mẫu
    if (email.startsWith('vai trò') || (!email && !idNumber)) continue;

    if (!email || !email.includes('@')) { errors.push({ email: email || '(trống)', error: 'Email không hợp lệ' }); continue; }
    if (!lastName || !firstName) { errors.push({ email, error: 'Thiếu Họ hoặc Tên' }); continue; }
    if (!idNumber || !/^\d{9,12}$/.test(idNumber)) { errors.push({ email, error: 'CCCD phải gồm 9-12 chữ số' }); continue; }
    if (!['student', 'staff'].includes(role)) { errors.push({ email, error: `Vai trò không hợp lệ: ${role}` }); continue; }

    const domain = email.split('@')[1];
    if (!['hcmuaf.edu.vn', 'st.hcmuaf.edu.vn'].includes(domain)) {
      errors.push({ email, error: 'Email phải thuộc @hcmuaf.edu.vn hoặc @st.hcmuaf.edu.vn' });
      continue;
    }

    if (!password) password = `Nnth@${idNumber}`;
    if (password.length < 8) { errors.push({ email, error: 'Mật khẩu phải từ 8 ký tự' }); continue; }

    try {
      const existing = await query('SELECT id FROM users WHERE email = $1 OR id_number = $2', [email, idNumber]);
      if (existing.rows.length > 0) { errors.push({ email, error: 'Email hoặc CCCD đã tồn tại' }); continue; }

      const hash = await bcrypt.hash(password, 12);
      await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, id_number, student_code,
           date_of_birth, place_of_birth, phone, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
        [email, hash, firstName, lastName, idNumber, studentCode || null,
         dob, pob || null, phone || null, role]
      );
      created.push(email);
    } catch (err) {
      errors.push({ email, error: err.code === '23505' ? 'Trùng dữ liệu (email/CCCD/MSSV)' : 'Lỗi hệ thống' });
    }
  }

  res.json({ created: created.length, errors });
});

// PATCH /api/admin/users/:id/role - đổi vai trò (super admin only)
router.patch('/users/:id/role', authenticate, requireSuperAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['student', 'staff', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ' });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Không thể tự đổi vai trò của chính mình' });
  }
  const result = await query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
    [role, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// DELETE /api/admin/users/:id - xóa tài khoản (super admin only)
router.delete('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Không thể tự xóa tài khoản của chính mình' });
  }

  // Không cho xóa nếu đã có ghi danh (giữ dữ liệu học vụ)
  const enroll = await query('SELECT id FROM enrollments WHERE student_id = $1 LIMIT 1', [req.params.id]);
  if (enroll.rows.length > 0) {
    return res.status(409).json({ error: 'Không thể xóa: người dùng đã có ghi danh khóa học. Hãy dùng chức năng Khóa tài khoản.' });
  }

  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, email', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Đã xóa tài khoản', ...result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Không thể xóa: người dùng có dữ liệu liên quan (kết quả thi, khóa học, thông báo...). Hãy dùng chức năng Khóa tài khoản.' });
    }
    throw err;
  }
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
