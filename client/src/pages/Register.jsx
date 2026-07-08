import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, FileText } from 'lucide-react';
import styles from './Auth.module.css';

export default function Register() {
  const handleGoogleRegister = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLogo}>
            <div className={styles.logoMark}>NN</div>
          </Link>
          <h1 className={styles.title}>Đăng ký tài khoản</h1>
          <p className={styles.subtitle}>
            Chỉ chấp nhận email của trường (<strong>@hcmuaf.edu.vn</strong> hoặc <strong>@st.hcmuaf.edu.vn</strong>)
          </p>
        </div>

        {/* Quy trình 3 bước */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '8px 0 24px' }}>
          {[
            { icon: ShieldCheck, text: 'Bước 1 — Xác thực email trường qua Google' },
            { icon: FileText, text: 'Bước 2 — Hoàn thiện hồ sơ: CCCD, họ tên, ngày sinh, nơi sinh' },
            { icon: UserCheck, text: 'Bước 3 — Tài khoản được tạo, bắt đầu ghi danh khóa học' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--color-muted-text)' }}>
              <Icon size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGoogleRegister}
          className={styles.googleBtn}
          style={{ padding: '14px 20px', fontSize: 15, fontWeight: 600 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Đăng ký bằng email trường
        </button>

        <p className={styles.helper} style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
          Thông tin hồ sơ chỉ được yêu cầu <strong>sau khi email đã xác thực</strong> thành công.
        </p>

        <p className={styles.switchLink}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
