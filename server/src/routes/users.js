const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  const result = await query(
    `SELECT id, email, first_name, last_name, id_number, student_code,
            date_of_birth, place_of_birth, phone, avatar_url, role, created_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  res.json(result.rows[0]);
});

// PUT /api/users/profile
router.put('/profile', authenticate, [
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone(),
  body('date_of_birth').optional().isDate(),
  body('place_of_birth').optional().trim(),
  body('id_number').optional().trim().isLength({ min: 9, max: 12 }),
  body('student_code').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const fields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'place_of_birth', 'id_number', 'student_code'];
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

  params.push(req.user.id);
  const result = await query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${pi} RETURNING id, email, first_name, last_name, id_number, student_code, date_of_birth, place_of_birth, phone`,
    params
  );
  res.json(result.rows[0]);
});

// PUT /api/users/change-password
router.put('/change-password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { current_password, new_password } = req.body;
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];

  if (!user.password_hash) {
    return res.status(400).json({ error: 'Tài khoản Google không có mật khẩu' });
  }

  const valid = await bcrypt.compare(current_password, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });

  const hash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);

  res.json({ message: 'Đã đổi mật khẩu thành công' });
});

module.exports = router;
