import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, BookOpen, CreditCard, FileText, TrendingUp, Clock } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './Dashboard.module.css';

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className={styles.statCard} style={{ '--accent': color }}>
      <div className={styles.statIcon}>
        <Icon size={22} />
      </div>
      <div>
        <div className={styles.statValue}>{value ?? '—'}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to} className={styles.statLink}>{card}</Link> : card;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });

  const { data: recentEnrollments } = useQuery({
    queryKey: ['admin-recent-enrollments'],
    queryFn: () => api.get('/enrollments?limit=8&sort=created_at').then(r => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const stats = data?.stats || {};

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Tổng quan</h1>
        <p className={styles.pageSubtitle}>Thống kê hệ thống</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard icon={Users} label="Tổng sinh viên" value={stats.total_users?.toLocaleString()} color="#0369A1" to="/admin/users" />
        <StatCard icon={BookOpen} label="Khóa học" value={stats.total_courses?.toLocaleString()} color="#059669" to="/admin/courses" />
        <StatCard icon={CreditCard} label="Ghi danh" value={stats.total_enrollments?.toLocaleString()} color="#7C3AED" to="/admin/enrollments" />
        <StatCard icon={FileText} label="Chờ xác nhận" value={stats.pending_enrollments?.toLocaleString()} color="#D97706" to="/admin/enrollments?status=pending" />
      </div>

      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Clock size={18} />
              Ghi danh gần đây
            </h2>
            <Link to="/admin/enrollments" className={styles.viewAll}>Xem tất cả</Link>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Khóa học</th>
                  <th>Trạng thái</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentEnrollments?.enrollments?.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div>{e.first_name} {e.last_name}</div>
                      <div className={styles.sub}>{e.email}</div>
                    </td>
                    <td>{e.course_name}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[e.status]}`}>
                        {statusLabel(e.status)}
                      </span>
                    </td>
                    <td className={styles.sub}>{new Date(e.created_at).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
                {!recentEnrollments?.enrollments?.length && (
                  <tr><td colSpan={4} className={styles.empty}>Chưa có ghi danh</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <TrendingUp size={18} />
              Thao tác nhanh
            </h2>
          </div>
          <div className={styles.quickActions}>
            <Link to="/admin/courses?action=new" className={styles.actionBtn}>
              <BookOpen size={20} />
              Thêm khóa học mới
            </Link>
            <Link to="/admin/exam-results" className={styles.actionBtn}>
              <FileText size={20} />
              Import kết quả thi
            </Link>
            <Link to="/admin/announcements?action=new" className={styles.actionBtn}>
              <FileText size={20} />
              Đăng thông báo
            </Link>
            <Link to="/admin/enrollments/export" className={styles.actionBtn}>
              <CreditCard size={20} />
              Xuất Excel ghi danh
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusLabel(s) {
  return { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy', rejected: 'Từ chối' }[s] || s;
}
