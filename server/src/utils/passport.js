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

    let result = await query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [profile.id, email]);

    if (result.rows.length === 0) {
      // New user - create with pending profile
      result = await query(
        `INSERT INTO users (google_id, email, first_name, last_name, avatar_url, email_verified, role)
         VALUES ($1, $2, $3, $4, $5, TRUE, 'student') RETURNING *`,
        [
          profile.id,
          email,
          profile.name?.givenName || '',
          profile.name?.familyName || '',
          profile.photos?.[0]?.value || null,
        ]
      );
    } else {
      // Existing user - update google_id if needed
      const user = result.rows[0];
      if (!user.google_id) {
        await query('UPDATE users SET google_id = $1, email_verified = TRUE WHERE id = $2', [profile.id, user.id]);
      }
    }

    return done(null, result.rows[0]);
  } catch (err) {
    return done(err);
  }
}));
