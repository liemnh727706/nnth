import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { CheckCircle, Search } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './AdminPage.module.css';

const METHOD_LABEL = {
  stripe: 'Stripe', vnpay: 'VNPay', momo: 'MoMo',
  zalopay: 'ZaloPay', bank_transfer: 'Chuyển khoản', cash: 'Tiền mặt',
};
const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'completed', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thất bại' },
];

export default function AdminPayments() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page, status],
    queryFn: () => api.get(`/payments?page=${page}&limit=20&status=${status}`).then(r => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => api.patch(`/payments/${id}/admin-confirm`),
    onSuccess: () => { qc.invalidateQueries(['admin-payments']); qc.invalidateQueries(['admin-enrollments']); toast.success('Đã xác nhận thanh toán'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý thanh toán</h1>
          <p className={styles.pageSubtitle}>{data?.total || 0} giao dịch</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.filtersBar}>
          <select className={styles.filterSelect} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Khóa học</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map(p => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.bold}>{p.student_name}</div>
                    <div className={styles.sub}>{p.student_email}</div>
                  </td>
                  <td>{p.course_name}</td>
                  <td className={styles.bold}>{Number(p.amount).toLocaleString('vi-VN')} đ</td>
                  <td><span className={styles.badge}>{METHOD_LABEL[p.method] || p.method}</span></td>
                  <td>
                    <span className={p.status === 'completed' ? styles.badgeConfirmed : p.status === 'failed' ? styles.badgeCancelled : styles.badgePending}>
                      {p.status === 'completed' ? 'Hoàn thành' : p.status === 'failed' ? 'Thất bại' : 'Chờ xác nhận'}
                    </span>
                  </td>
                  <td className={styles.sub}>{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    {p.status === 'pending' && (
                      <button
                        className={styles.btnSecondary}
                        style={{ fontSize: 12, padding: '4px 10px' }}
                        onClick={() => window.confirm(`Xác nhận đã nhận ${Number(p.amount).toLocaleString('vi-VN')} đ từ ${p.student_name}? Ghi danh sẽ được xác nhận tự động.`) && confirmMutation.mutate(p.id)}
                        disabled={confirmMutation.isPending}
                        title="Xác nhận thanh toán — tự động xác nhận ghi danh"
                      >
                        <CheckCircle size={14} /> Xác nhận
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!(data?.data || []).length && (
                <tr><td colSpan={7} className={styles.empty}>Không có giao dịch</td></tr>
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
