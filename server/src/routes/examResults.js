const router = require('express').Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { query } = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/exam-results/', limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/exam-results/my
router.get('/my', authenticate, async (req, res) => {
  const result = await query(
    `SELECT er.*, c.name_vi, c.name_en, c.code AS course_code
     FROM exam_results er
     JOIN courses c ON c.id = er.course_id
     WHERE er.student_id = $1 AND er.published_at IS NOT NULL AND er.published_at <= NOW()
     ORDER BY er.exam_date DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// GET /api/exam-results - admin
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { course_id } = req.query;
  const params = course_id ? [course_id] : [];
  const where = course_id ? 'WHERE er.course_id = $1' : '';

  const result = await query(
    `SELECT er.*, c.name_vi, c.code AS course_code,
            u.first_name || ' ' || u.last_name AS student_name,
            u.email, u.id_number, u.student_code
     FROM exam_results er
     JOIN courses c ON c.id = er.course_id
     JOIN users u ON u.id = er.student_id
     ${where}
     ORDER BY er.exam_date DESC`,
    params
  );
  res.json(result.rows);
});

// POST /api/exam-results/import - upload Excel/PDF
router.post('/import', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File required' });

  const { course_id, exam_date } = req.body;
  if (!course_id || !exam_date) return res.status(400).json({ error: 'course_id and exam_date required' });

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
    const idNumber = String(row['CCCD'] || row['id_number'] || row['cccd'] || '').trim();
    const score = parseFloat(row['Điểm'] || row['score'] || row['Score'] || 0);
    const grade = String(row['Xếp loại'] || row['grade'] || row['Grade'] || '').trim();
    const remarks = String(row['Ghi chú'] || row['remarks'] || '').trim();

    if (!idNumber) { errors.push({ row, error: 'Missing CCCD' }); continue; }

    const user = await query('SELECT id FROM users WHERE id_number = $1', [idNumber]);
    if (!user.rows[0]) { errors.push({ row, error: `Student not found: ${idNumber}` }); continue; }

    await query(
      `INSERT INTO exam_results (student_id, course_id, exam_date, score, grade, remarks, source, source_file_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'excel_upload', $7, $8)
       ON CONFLICT (student_id, course_id, exam_date)
       DO UPDATE SET score = EXCLUDED.score, grade = EXCLUDED.grade, remarks = EXCLUDED.remarks`,
      [user.rows[0].id, course_id, exam_date, score || null, grade || null, remarks || null,
       `/uploads/exam-results/${req.file.filename}`, req.user.id]
    );
    imported.push(idNumber);
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

// PATCH /api/exam-results/publish-all - publish all results for a course
router.patch('/publish-all', authenticate, requireAdmin, async (req, res) => {
  const { course_id, exam_date } = req.body;
  await query(
    'UPDATE exam_results SET published_at = NOW() WHERE course_id = $1 AND exam_date = $2 AND published_at IS NULL',
    [course_id, exam_date]
  );
  res.json({ message: 'Đã công bố kết quả thi' });
});

module.exports = router;
