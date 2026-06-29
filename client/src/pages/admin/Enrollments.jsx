import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Download, CheckCircle, XCircle, Search } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './AdminPage.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function AdminEnrollments() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-enrollments', page, status, search],
    queryFn: () => api.get(`/enrollments?page=${page}&limit=20&status=${status}&search=${search}`).then(r => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => api.patch(`/enrollments/${id}/confirm`),
    onSuccess: () => { qc.invalidateQueries(['admin-enrollments']); toast.success('Đã xác nhận ghi danh'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.patch(`/enrollments/${id}/cancel`),
    onSuccess: () => { qc.invalidateQueries(['admin-enrollments']); toast.success('Đã hủy ghi danh'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/export/enrollments', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `danh-sach-ghi-danh-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Xuất file thất bại');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý ghi danh</h1>
          <p className={styles.pageSubtitle}>{data?.total || 0} ghi danh</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleExport}>
          <Download size={16} /> Xuất Excel
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.filtersBar}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-text)' }} />
            <input
              type="search"
              placeholder="Tìm theo tên, email, MSSV..."
              className={styles.filterInput}
              style={{ paddingLeft: 32, width: '100%' }}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className={styles.filterSelect} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>CCCD</th>
                <th>Khóa học</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.enrollments?.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className={styles.bold}>{e.last_name} {e.first_name}</div>
                    <div className={styles.sub}>{e.email}</div>
                  </td>
                  <td className={styles.sub}>{e.id_number || '—'}</td>
                  <td>{e.course_name}</td>
                  <td>
                    <span className={e.payment_status === 'completed' ? styles.badgeConfirmed : styles.badgePending}>
                      {e.payment_status === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td>
                    <span className={
                      e.status === 'confirmed' ? styles.badgeConfirmed :
                      e.status === 'cancelled' ? styles.badgeCancelled :
                      styles.badgePending
                    }>
                      {STATUS_OPTIONS.find(o => o.value === e.status)?.label || e.status}
                    </span>
                  </td>
                  <td className={styles.sub}>{new Date(e.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className={styles.actions}>
                      {e.status === 'pending' && (
                        <>
                          <button
                            className={styles.btnSuccess}
                            onClick={() => confirmMutation.mutate(e.id)}
                            disabled={confirmMutation.isLoading}
                            title="Xác nhận"
                          >
                            <CheckCircle size={14} /> Xác nhận
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.danger}`}
                            onClick={() => cancelMutation.mutate(e.id)}
                            disabled={cancelMutation.isLoading}
                            title="Hủy"
                            aria-label="Hủy ghi danh"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.enrollments?.length && (
                <tr><td colSpan={7} className={styles.empty}>Không có ghi danh nào</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>‹ Trước</button>
            <span className={styles.pageInfo}>Trang {page}/{data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Tiếp ›</button>
          </div>
        )}
      </div>
    </div>
  );
}
