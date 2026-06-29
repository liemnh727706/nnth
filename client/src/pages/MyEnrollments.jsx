import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, MapPin } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './MyEnrollments.module.css';

const STATUS_LABEL = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy' };
const STATUS_CLASS = { confirmed: 'ok', cancelled: 'bad', pending: 'pend' };

export default function MyEnrollments() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-enrollments', status],
    queryFn: () => api.get(`/enrollments/my?status=${status}`).then(r => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Ghi danh của tôi</h1>
          <div className={styles.tabs}>
            {[{ v: '', l: 'Tất cả' }, { v: 'confirmed', l: 'Đã xác nhận' }, { v: 'pending', l: 'Chờ xử lý' }, { v: 'cancelled', l: 'Đã hủy' }].map(t => (
              <button key={t.v} className={`${styles.tab} ${status === t.v ? styles.activeTab : ''}`} onClick={() => setStatus(t.v)}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {data?.enrollments?.length ? (
          <div className={styles.list}>
            {data.enrollments.map(e => (
              <div key={e.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <div className={styles.cardTop}>
                    <h2 className={styles.courseName}>{e.course_name}</h2>
                    <span className={`${styles.badge} ${styles[STATUS_CLASS[e.status]]}`}>
                      {STATUS_LABEL[e.status] || e.status}
                    </span>
                  </div>
                  <div className={styles.meta}>
                    <span><Calendar size={14} /> {new Date(e.start_date).toLocaleDateString('vi-VN')} — {new Date(e.end_date).toLocaleDateString('vi-VN')}</span>
                    <span><BookOpen size={14} /> {e.category === 'foreign_language' ? 'Ngoại ngữ' : 'Tin học'}</span>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.tuition}>{Number(e.tuition_fee).toLocaleString('vi-VN')} đ</span>
                    {e.status === 'pending' && (
                      <Link to={`/courses/${e.course_id}`} className={styles.payBtn}>Thanh toán</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <BookOpen size={48} />
            <p>Bạn chưa ghi danh khóa học nào</p>
            <Link to="/courses" className={styles.emptyBtn}>Xem khóa học</Link>
          </div>
        )}
      </div>
    </div>
  );
}
