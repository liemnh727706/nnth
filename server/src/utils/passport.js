const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { query } = require('./db');

const ALLOWED_DOMAINS = ['hcmuaf.edu.vn', 'st.hcmuaf.edu.vn'];

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email from Google'));

    const domain = email.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return done(null, false, { message: `Email domain @${domain} không được phép. Vui lòng dùng email @hcmuaf.edu.vn hoặc @st.hcmuaf.edu.vn.` });
    }

    const result = await query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [profile.id, email]);

    if (result.rows.length === 0) {
      // User mới — KHÔNG tạo account ngay. Chuyển sang bước hoàn tất hồ sơ.
      return done(null, {
        isNew: true,
        google_id: profile.id,
        email,
        first_name: profile.name?.givenName || '',
        last_name: profile.name?.familyName || '',
        avatar_url: profile.photos?.[0]?.value || null,
      });
    }

    // User đã tồn tại — cập nhật google_id nếu cần
    const user = result.rows[0];
    if (!user.google_id) {
      await query('UPDATE users SET google_id = $1, email_verified = TRUE WHERE id = $2', [profile.id, user.id]);
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));
