import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import styles from './SimpleInfo.module.css';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('status') === 'success' || searchParams.get('vnp_ResponseCode') === '00';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {success ? (
          <>
            <CheckCircle size={56} color="#059669" />
            <h1 className={styles.title}>Thanh toán thành công!</h1>
            <p className={styles.desc}>Ghi danh của bạn đã được xác nhận. Chúc bạn học tốt!</p>
            <Link to="/my-enrollments" className={styles.btn}>Xem ghi danh của tôi</Link>
          </>
        ) : (
          <>
            <XCircle size={56} color="#DC2626" />
            <h1 className={styles.title}>Thanh toán thất bại</h1>
            <p className={styles.desc}>Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức khác.</p>
            <Link to="/my-enrollments" className={styles.btn}>Quay lại</Link>
          </>
        )}
      </div>
    </div>
  );
}
