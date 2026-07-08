import React, { useMemo } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import styles from './Auth.module.css';

// Đọc payload JWT (chỉ để hiển thị, server vẫn xác minh chữ ký)
// Dùng TextDecoder để decode đúng UTF-8 (atob thuần làm hỏng tiếng Việt)
function decodeJwt(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8').decode(bytes));
  } catch {
    return null;
  }
}

export default function CompleteProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('token') || '';

  const payload = useMemo(() => decodeJwt(token), [token]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      first_name: payload?.first_name || '',
      last_name: payload?.last_name || '',
    },
  });

  if (!token || !payload || payload.purpose !== 'complete_profile') {
    return <Navigate to="/login?error=auth_failed" replace />;
  }

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/complete-profile', { token, ...data });
      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');
      login({ accessToken, refreshToken }, user);
      toast.success('Tạo tài khoản thành công!');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 520 }}>
        <h1 className={styles.title}>Hoàn tất hồ sơ</h1>
        <p className={styles.subtitle}>
          Đăng nhập với <strong>{payload.email}</strong>.<br />
          Vui lòng bổ sung thông tin bắt buộc để hoàn tất tạo tài khoản.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className={styles.field}>
              <label className={styles.label}>Họ *</label>
              <input className={styles.input}
                {...register('last_name', { required: 'Họ là bắt buộc' })} />
              {errors.last_name && <p className={styles.error}>{errors.last_name.message}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tên *</label>
              <input className={styles.input}
                {...register('first_name', { required: 'Tên là bắt buộc' })} />
              {errors.first_name && <p className={styles.error}>{errors.first_name.message}</p>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Số CCCD *</label>
            <input className={styles.input} placeholder="9–12 chữ số" inputMode="numeric"
              {...register('id_number', {
                required: 'Số CCCD là bắt buộc',
                pattern: { value: /^\d{9,12}$/, message: 'CCCD phải gồm 9–12 chữ số' },
              })} />
            {errors.id_number && <p className={styles.error}>{errors.id_number.message}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className={styles.field}>
              <label className={styles.label}>Ngày sinh *</label>
              <input type="date" className={styles.input}
                {...register('date_of_birth', { required: 'Ngày sinh là bắt buộc' })} />
              {errors.date_of_birth && <p className={styles.error}>{errors.date_of_birth.message}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Nơi sinh *</label>
              <input className={styles.input} placeholder="VD: TP.HCM"
                {...register('place_of_birth', { required: 'Nơi sinh là bắt buộc' })} />
              {errors.place_of_birth && <p className={styles.error}>{errors.place_of_birth.message}</p>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email khác (không bắt buộc)</label>
            <input type="email" className={styles.input} placeholder="email cá nhân dự phòng"
              {...register('secondary_email')} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Đang tạo tài khoản...' : 'Hoàn tất & Tạo tài khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}
