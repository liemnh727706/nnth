const router = require('express').Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../utils/db');
const { sendVerificationEmail } = require('../services/email');
const { authenticate } = require('../middleware/auth');

const ALLOWED_DOMAINS = ['hcmuaf.edu.vn', 'st.hcmuaf.edu.vn'];

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('id_number').trim().isLength({ min: 9, max: 12 }).matches(/^\d+$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, first_name, last_name, id_number, student_code, date_of_birth, place_of_birth } = req.body;

  const domain = email.split('@')[1];
  if (!ALLOWED_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: `Email phải thuộc tên miền @hcmuaf.edu.vn hoặc @st.hcmuaf.edu.vn` });
  }

  try {
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR id_number = $2',
      [email, id_number]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email hoặc số CCCD đã được đăng ký' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, id_number, student_code, date_of_birth, place_of_birth)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email`,
      [email, password_hash, first_name, last_name, id_number, student_code || null, date_of_birth || null, place_of_birth || null]
    );

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    await sendVerificationEmail(email, token, first_name);

    res.status(201).json({ message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email hoặc số CCCD đã tồn tại' });
    throw err;
  }
});

// GET /api/auth/verify-email?token=...
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token không hợp lệ' });

  const result = await query(
    `SELECT evt.*, u.email FROM email_verification_tokens evt
     JOIN users u ON u.id = evt.user_id
     WHERE evt.token = $1 AND evt.used_at IS NULL AND evt.expires_at > NOW()`,
    [token]
  );

  if (!result.rows[0]) return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });

  const { user_id } = result.rows[0];
  await query('UPDATE users SET email_verified = TRUE WHERE id = $1', [user_id]);
  await query('UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1', [token]);

  res.json({ message: 'Email đã được xác nhận thành công' });
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
  }

  if (!user.email_verified) {
    return res.status(403).json({ error: 'Vui lòng xác nhận email trước khi đăng nhập', code: 'EMAIL_NOT_VERIFIED' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });

  const { accessToken, refreshToken } = generateTokens(user.id);

  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
    [user.id, refreshToken]
  );

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      avatar_url: user.avatar_url,
      id_number: user.id_number,
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked_at IS NULL AND expires_at > NOW()',
      [refreshToken]
    );

    if (!result.rows[0]) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const tokens = generateTokens(payload.sub);

    // Rotate refresh token
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1', [refreshToken]);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [payload.sub, tokens.refreshToken]
    );

    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1', [refreshToken]);
  }
  res.json({ message: 'Đã đăng xuất' });
});

// GET /api/auth/google
router.get('/google', passport.authenticate('google', { session: false }));

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  async (req, res) => {
    const user = req.user;
    const { accessToken, refreshToken } = generateTokens(user.id);

    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, refreshToken]
    );

    // Redirect to frontend with tokens
    const params = new URLSearchParams({ accessToken, refreshToken });
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?${params}`);
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const result = await query(
    'SELECT id, email, first_name, last_name, id_number, student_code, date_of_birth, place_of_birth, phone, avatar_url, role, email_verified, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
