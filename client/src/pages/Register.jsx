import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import styles from './Auth.module.css';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 560 }}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLogo}>
            <div className={styles.logoMark}>NN</div>
          </Link>
          <h1 className={styles.title}>{t('auth.register')}</h1>
          <p className={styles.subtitle}>{t('auth.email_domain_hint')}</p>
        </div>

        <button
          type="button"
          onClick={() => window.location.href = '/api/auth/google'}
          className={styles.googleBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('auth.login_google')}
        </button>

        <div className={styles.divider}><span>hoặc điền thông tin</span></div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="last_name" className={styles.label}>{t('auth.last_name')} *</label>
              <input
                id="last_name"
                type="text"
                autoComplete="family-name"
                className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                {...register('last_name', { required: 'Họ là bắt buộc' })}
                aria-invalid={!!errors.last_name}
              />
              {errors.last_name && <p className={styles.error} role="alert">{errors.last_name.message}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="first_name" className={styles.label}>{t('auth.first_name')} *</label>
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                {...register('first_name', { required: 'Tên là bắt buộc' })}
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name && <p className={styles.error} role="alert">{errors.first_name.message}</p>}
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>{t('auth.email')} *</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tenban@st.hcmuaf.edu.vn"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              {...register('email', {
                required: 'Email là bắt buộc',
                pattern: {
                  value: /^[^\s@]+@(st\.hcmuaf\.edu\.vn|hcmuaf\.edu\.vn)$/,
                  message: 'Chỉ chấp nhận email @hcmuaf.edu.vn hoặc @st.hcmuaf.edu.vn',
                },
              })}
              aria-invalid={!!errors.email}
              aria-describedby="email-hint"
            />
            <p id="email-hint" className={styles.helper}>{t('auth.email_domain_hint')}</p>
            {errors.email && <p className={styles.error} role="alert">{errors.email.message}</p>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="id_number" className={styles.label}>{t('auth.id_number')} *</label>
              <input
                id="id_number"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={`${styles.input} ${errors.id_number ? styles.inputError : ''}`}
                {...register('id_number', {
                  required: 'Số CCCD là bắt buộc',
                  pattern: { value: /^\d{9,12}$/, message: 'CCCD phải là 9-12 chữ số' },
                })}
                aria-invalid={!!errors.id_number}
              />
              {errors.id_number && <p className={styles.error} role="alert">{errors.id_number.message}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="student_code" className={styles.label}>{t('auth.student_code')}</label>
              <input
                id="student_code"
                type="text"
                className={styles.input}
                {...register('student_code')}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label htmlFor="date_of_birth" className={styles.label}>{t('auth.date_of_birth')}</label>
              <input
                id="date_of_birth"
                type="date"
                className={styles.input}
                {...register('date_of_birth')}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="place_of_birth" className={styles.label}>{t('auth.place_of_birth')}</label>
              <input
                id="place_of_birth"
                type="text"
                className={styles.input}
                {...register('place_of_birth')}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>{t('auth.password')} *</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                {...register('password', {
                  required: 'Mật khẩu là bắt buộc',
                  minLength: { value: 8, message: 'Mật khẩu ít nhất 8 ký tự' },
                })}
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

          <div className={styles.field}>
            <label htmlFor="confirm_password" className={styles.label}>{t('auth.confirm_password')} *</label>
            <input
              id="confirm_password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`${styles.input} ${errors.confirm_password ? styles.inputError : ''}`}
              {...register('confirm_password', {
                required: 'Vui lòng xác nhận mật khẩu',
                validate: v => v === password || 'Mật khẩu không khớp',
              })}
              aria-invalid={!!errors.confirm_password}
            />
            {errors.confirm_password && <p className={styles.error} role="alert">{errors.confirm_password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Đang xử lý...' : t('auth.register')}
          </button>
        </form>

        <p className={styles.switchLink}>
          {t('auth.have_account')}{' '}
          <Link to="/login">{t('nav.login')}</Link>
        </p>
      </div>
    </div>
  );
}
