import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false); // form email/mật khẩu chỉ dành cho quản trị

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      login({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken }, res.data.user);
      toast.success('Đăng nhập thành công!');
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLogo}>
            <div className={styles.logoMark}>NN</div>
          </Link>
          <h1 className={styles.title}>Đăng nhập</h1>
          <p className={styles.subtitle}>
            Sử dụng email của trường (<strong>@hcmuaf.edu.vn</strong> hoặc <strong>@st.hcmuaf.edu.vn</strong>)
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className={styles.googleBtn}
          style={{ padding: '14px 20px', fontSize: 15, fontWeight: 600 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Đăng nhập bằng email trường
        </button>

        <p className={styles.helper} style={{ textAlign: 'center', marginTop: 12, fontSize: 13 }}>
          Lần đầu đăng nhập? Hệ thống sẽ hướng dẫn bạn hoàn tất hồ sơ sau khi xác thực email.
        </p>

        {/* Đăng nhập quản trị (email/mật khẩu) — ẩn mặc định */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={() => setAdminMode(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--color-muted-text)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {adminMode ? 'Ẩn đăng nhập quản trị' : 'Đăng nhập quản trị viên'}
          </button>
        </div>

        {adminMode && (
          <>
            <div className={styles.divider}><span>tài khoản quản trị</span></div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Email *</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  {...register('email', {
                    required: 'Email là bắt buộc',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' },
                  })}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className={styles.error} role="alert">{errors.email.message}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Mật khẩu *</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    {...register('password', { required: 'Mật khẩu là bắt buộc' })}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className={styles.error} role="alert">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
