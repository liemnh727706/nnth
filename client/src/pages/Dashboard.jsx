import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { BookOpen, FileText, Bell, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: enrollments, isLoading: loadEnroll } = useQuery({
    queryKey: ['my-enrollments-summary'],
    queryFn: () => api.get('/enrollments/my?limit=5').then(r => r.data),
  });

  const { data: examResults } = useQuery({
    queryKey: ['my-exam-results-summary'],
    queryFn: () => api.get('/exam-results/my?limit=5').then(r => r.data),
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements-summary'],
    queryFn: () => api.get('/announcements?limit=5').then(r => r.data),
  });

  if (loadEnroll) return <LoadingSpinner />;

  const activeEnrollments = enrollments?.enrollments?.filter(e => e.status === 'confirmed') || [];

  return (
    <div className={styles.page}>
      <div className={styles.welcome}>
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeTitle}>Xin chào, {user?.first_name}!</h1>
          <p className={styles.welcomeSub}>Đây là tổng quan tài khoản của bạn</p>
        </div>
        <Link to="/courses" className={styles.welcomeBtn}>
          Tìm khóa học <ArrowRight size={16} />
        </Link>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <BookOpen size={22} style={{ color: '#0369A1' }} />
          <div>
            <div className={styles.statNum}>{activeEnrollments.length}</div>
            <div className={styles.statLabel}>Khóa học đang học</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <FileText size={22} style={{ color: '#059669' }} />
          <div>
            <div className={styles.statNum}>{examResults?.results?.length || 0}</div>
            <div className={styles.statLabel}>Kết quả thi</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <Bell size={22} style={{ color: '#7C3AED' }} />
          <div>
            <div className={styles.statNum}>{announcements?.total || 0}</div>
            <div className={styles.statLabel}>Thông báo mới</div>
          </div>
        </div>
      </div>

      <div className={styles.panels}>
        {/* Enrollments */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Ghi danh gần đây</h2>
            <Link to="/my-enrollments" className={styles.panelLink}>Xem tất cả <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.panelBody}>
            {enrollments?.enrollments?.length ? enrollments.enrollments.map(e => (
              <div key={e.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemTitle}>{e.course_name}</div>
                  <div className={styles.itemSub}>{new Date(e.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
                <span className={`${styles.badge} ${e.status === 'confirmed' ? styles.badgeOk : e.status === 'cancelled' ? styles.badgeBad : styles.badgePend}`}>
                  {e.status === 'confirmed' ? 'Đã xác nhận' : e.status === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý'}
                </span>
              </div>
            )) : (
              <div className={styles.empty}>
                <BookOpen size={32} />
                <p>Bạn chưa ghi danh khóa học nào</p>
                <Link to="/courses" className={styles.emptyLink}>Khám phá khóa học</Link>
              </div>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Thông báo mới nhất</h2>
            <Link to="/announcements" className={styles.panelLink}>Xem tất cả <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.panelBody}>
            {announcements?.announcements?.length ? announcements.announcements.map(a => (
              <div key={a.id} className={styles.listItem}>
                <div>
                  <div className={styles.itemTitle}>{a.title}</div>
                  <div className={styles.itemSub}>{new Date(a.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
                {a.is_pinned && <span className={styles.pinBadge}>📌</span>}
              </div>
            )) : (
              <div className={styles.empty}><Bell size={32} /><p>Chưa có thông báo</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
