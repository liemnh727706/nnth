import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './SimpleInfo.module.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') return <LoadingSpinner fullScreen />;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {status === 'success' ? (
          <>
            <CheckCircle size={56} color="#059669" />
            <h1 className={styles.title}>Xác nhận email thành công!</h1>
            <p className={styles.desc}>Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay.</p>
            <Link to="/login" className={styles.btn}>Đăng nhập</Link>
          </>
        ) : (
          <>
            <XCircle size={56} color="#DC2626" />
            <h1 className={styles.title}>Xác nhận thất bại</h1>
            <p className={styles.desc}>Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.</p>
            <Link to="/register" className={styles.btn}>Đăng ký lại</Link>
          </>
        )}
      </div>
    </div>
  );
}
