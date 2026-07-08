const router = require('express').Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { query } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/exam-results/', limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/exam-results/template - tải file Excel mẫu (staff/admin)
router.get('/template', authenticate, requireAdmin, (req, res) => {
  const headers = [
    'MSSV', 'CCCD', 'Họ', 'Tên', 'Ngày sinh', 'Nơi sinh',
    'Điểm trắc nghiệm', 'Điểm thực hành 1', 'Điểm thực hành 2', 'Điểm thực hành 3',
    'Điểm tổng', 'Kết quả', 'Ghi chú',
  ];
  const example = [
    '20130001', '079203001234', 'Nguyễn Văn', 'An', '15/03/2003', 'TP.HCM',
    8.5, 7.0, 8.0, '', 7.8, 'Đạt', 'Ghi chú nếu có',
  ];
  const note = [
    'Lưu ý: chỉ cần MSSV HOẶC CCCD (một trong hai) để nhận diện sinh viên.',
    '', '', '', '', '', 'Điểm thực hành có thể có 1-3 cột tùy môn thi', '', '', '', '', '', '',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, example, note]);
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KetQuaThi');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="mau-ket-qua-thi.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// GET /api/exam-results/my - sinh viên chỉ thấy điểm của chính mình
router.get('/my', authenticate, async (req, res) => {
  const result = await query(
    `SELECT er.id, er.exam_date, er.theory_score, er.practice_scores, er.total_score,
            er.result, er.score, er.grade, er.remarks, er.published_at,
            c.name_vi AS course_name, c.code AS course_code
     FROM exam_results er
     JOIN courses c ON c.id = er.course_id
     WHERE er.student_id = $1 AND er.published_at IS NOT NULL AND er.published_at <= NOW()
     ORDER BY er.exam_date DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// GET /api/exam-results - chỉ staff/admin (không public)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { course_id } = req.query;
  const params = course_id ? [course_id] : [];
  const where = course_id ? 'WHERE er.course_id = $1' : '';

  const result = await query(
    `SELECT er.*, c.name_vi AS course_name, c.code AS course_code,
            u.first_name, u.last_name, u.email, u.id_number, u.student_code,
            u.date_of_birth, u.place_of_birth
     FROM exam_results er
     JOIN courses c ON c.id = er.course_id
     JOIN users u ON u.id = er.student_id
     ${where}
     ORDER BY er.exam_date DESC, u.last_name`,
    params
  );
  res.json(result.rows);
});

// POST /api/exam-results/import - staff upload Excel theo file mẫu
router.post('/import', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Chưa chọn file' });

  const { course_id, exam_date } = req.body;
  if (!course_id || !exam_date) return res.status(400).json({ error: 'Vui lòng chọn khóa học và ngày thi trước khi import' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    return res.status(400).json({ error: 'Chỉ hỗ trợ file Excel (.xlsx, .xls, .csv)' });
  }

  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const imported = [];
  const errors = [];

  for (const row of rows) {
    const mssv = String(row['MSSV'] || row['mssv'] || '').trim();
    const idNumber = String(row['CCCD'] || row['cccd'] || row['id_number'] || '').trim();

    if (!mssv && !idNumber) { errors.push({ row: JSON.stringify(row).slice(0, 80), error: 'Thiếu MSSV và CCCD' }); continue; }
    // Bỏ qua dòng ghi chú trong file mẫu
    if (mssv.startsWith('Lưu ý')) continue;

    // Tìm sinh viên theo MSSV (student_code hoặc email trường) hoặc CCCD
    const user = await query(
      `SELECT id FROM users WHERE
         ($1 <> '' AND (student_code = $1 OR LOWER(email) = LOWER($1 || '@st.hcmuaf.edu.vn')))
         OR ($2 <> '' AND id_number = $2)
       LIMIT 1`,
      [mssv, idNumber]
    );
    if (!user.rows[0]) { errors.push({ row: mssv || idNumber, error: 'Không tìm thấy sinh viên' }); continue; }

    const theory = row['Điểm trắc nghiệm'] !== undefined && row['Điểm trắc nghiệm'] !== '' ? parseFloat(row['Điểm trắc nghiệm']) : null;

    // Gom các cột "Điểm thực hành ..." thành mảng thành phần
    const practices = [];
    for (const key of Object.keys(row)) {
      if (/^Điểm thực hành/i.test(key) && row[key] !== '' && row[key] !== undefined) {
        const val = parseFloat(row[key]);
        if (!isNaN(val)) practices.push({ name: key, score: val });
      }
    }

    const total = row['Điểm tổng'] !== undefined && row['Điểm tổng'] !== '' ? parseFloat(row['Điểm tổng']) : null;
    const examResult = String(row['Kết quả'] || '').trim() || (total !== null ? (total >= 5 ? 'Đạt' : 'Không đạt') : null);
    const remarks = String(row['Ghi chú'] || row['remarks'] || '').trim();

    await query(
      `INSERT INTO exam_results (student_id, course_id, exam_date, theory_score, practice_scores,
         total_score, result, score, remarks, source, source_file_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'excel_upload', $10, $11)
       ON CONFLICT (student_id, course_id, exam_date)
       DO UPDATE SET theory_score = EXCLUDED.theory_score, practice_scores = EXCLUDED.practice_scores,
         total_score = EXCLUDED.total_score, result = EXCLUDED.result, score = EXCLUDED.score,
         remarks = EXCLUDED.remarks`,
      [user.rows[0].id, course_id, exam_date, theory, JSON.stringify(practices),
       total, examResult, total, remarks || null,
       `/uploads/exam-results/${req.file.filename}`, req.user.id]
    );
    imported.push(mssv || idNumber);
  }

  res.json({ imported: imported.length, errors });
});

// PATCH /api/exam-results/:id/publish
router.patch('/:id/publish', authenticate, requireAdmin, async (req, res) => {
  const result = await query(
    'UPDATE exam_results SET published_at = NOW() WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

// PATCH /api/exam-results/publish-all - công bố tất cả kết quả chưa công bố (tùy chọn lọc theo khóa/ngày)
router.patch('/publish-all', authenticate, requireAdmin, async (req, res) => {
  const { course_id, exam_date } = req.body || {};
  const where = ['published_at IS NULL'];
  const params = [];
  let pi = 1;
  if (course_id) { where.push(`course_id = $${pi++}`); params.push(course_id); }
  if (exam_date) { where.push(`exam_date = $${pi++}`); params.push(exam_date); }

  const result = await query(
    `UPDATE exam_results SET published_at = NOW() WHERE ${where.join(' AND ')} RETURNING id`,
    params
  );
  res.json({ message: `Đã công bố ${result.rows.length} kết quả thi` });
});

module.exports = router;
