import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Download, CheckCircle, XCircle, Search, Plus, X } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './AdminPage.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending_payment', label: 'Chờ thanh toán' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_LABELS = {
  pending_payment: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
};

const LIMIT = 20;

/* Modal thêm sinh viên vào khóa học */
function AddEnrollmentModal({ onClose }) {
  const qc = useQueryClient();
  const [studentSearch, setStudentSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [markPaid, setMarkPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const { data: studentsData } = useQuery({
    queryKey: ['students-search', studentSearch],
    queryFn: () => api.get(`/admin/users?limit=10&role=student&search=${encodeURIComponent(studentSearch)}`).then(r => r.data),
    enabled: studentSearch.length >= 2,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses-for-enroll'],
    queryFn: () => api.get('/courses?limit=50').then(r => r.data),
  });

  const students = studentsData?.data || [];
  const courses = coursesData?.data || [];
  const selectedStudent = students.find(s => s.id === studentId);

  const addMutation = useMutation({
    mutationFn: () => api.post('/enrollments/admin', {
      student_id: studentId,
      course_id: courseId,
      mark_paid: markPaid,
      payment_method: paymentMethod,
      confirm: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-enrollments']);
      toast.success('Đã thêm sinh viên vào khóa học');
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal} style={{ maxWidth: 520 }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Thêm sinh viên vào khóa học</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Tìm sinh viên (tên, email, MSSV, CCCD) *</label>
            <input className={styles.input} placeholder="Gõ ít nhất 2 ký tự..."
              value={studentSearch}
              onChange={e => { setStudentSearch(e.target.value); setStudentId(''); }} />
            {studentSearch.length >= 2 && !selectedStudent && (
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, marginTop: 6, maxHeight: 180, overflowY: 'auto' }}>
                {students.length ? students.map(s => (
                  <div key={s.id}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid var(--color-border)' }}
                    onClick={() => { setStudentId(s.id); setStudentSearch(`${s.last_name} ${s.first_name} — ${s.email}`); }}>
                    <strong>{s.last_name} {s.first_name}</strong>
                    <div style={{ fontSize: 12, color: 'var(--color-muted-text)' }}>{s.email} · CCCD: {s.id_number || '—'}</div>
                  </div>
                )) : <div style={{ padding: 12, fontSize: 13, color: 'var(--color-muted-text)' }}>Không tìm thấy sinh viên</div>}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Khóa học *</label>
            <select className={styles.input} value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">— Chọn khóa học —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name_vi} ({c.seats_available ?? (c.max_students - c.current_students)} chỗ trống)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={markPaid} onChange={e => setMarkPaid(e.target.checked)}
                style={{ width: 16, height: 16 }} />
              <span className={styles.label} style={{ marginBottom: 0 }}>
                Đã thanh toán (admin xác thực — ghi nhận thanh toán và xác nhận ghi danh luôn)
              </span>
            </label>
          </div>

          {markPaid && (
            <div className={styles.field}>
              <label className={styles.label}>Hình thức thanh toán</label>
              <select className={styles.input} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
              </select>
            </div>
          )}

          {!markPaid && (
            <p style={{ fontSize: 13, color: 'var(--color-muted-text)' }}>
              Ghi danh sẽ được <strong>xác nhận ngay</strong> (không chờ thanh toán). Bỏ chọn cả 2 nếu muốn sinh viên tự thanh toán online.
            </p>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Hủy</button>
            <button type="button" className={styles.btnPrimary}
              disabled={!studentId || !courseId || addMutation.isPending}
              onClick={() => addMutation.mutate()}>
              {addMutation.isPending ? 'Đang thêm...' : 'Thêm vào khóa học'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEnrollments() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-enrollments', page, status],
    queryFn: () => api.get(`/enrollments?page=${page}&limit=${LIMIT}&status=${status}`).then(r => r.data),
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

  const rows = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  // Lọc tìm kiếm phía client (tên, email, MSSV, CCCD)
  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(e =>
        (e.student_name || '').toLowerCase().includes(q) ||
        (e.student_email || '').toLowerCase().includes(q) ||
        (e.student_code || '').toLowerCase().includes(q) ||
        (e.id_number || '').includes(q))
    : rows;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý ghi danh</h1>
          <p className={styles.pageSubtitle}>{total} ghi danh</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button className={styles.btnSecondary} onClick={handleExport}>
            <Download size={16} /> Xuất Excel
          </button>
          <button className={styles.btnPrimary} onClick={() => setAddModal(true)}>
            <Plus size={16} /> Thêm sinh viên vào khóa học
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.filtersBar}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-text)' }} />
            <input
              type="search"
              placeholder="Tìm theo tên, email, MSSV, CCCD..."
              className={styles.filterInput}
              style={{ paddingLeft: 32, width: '100%' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
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
                <th>CCCD / MSSV</th>
                <th>Khóa học</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className={styles.bold}>{e.student_name}</div>
                    <div className={styles.sub}>{e.student_email}</div>
                  </td>
                  <td className={styles.sub}>
                    {e.id_number || '—'}
                    <div>{e.student_code || ''}</div>
                  </td>
                  <td>
                    {e.course_name}
                    <div className={styles.sub}>{e.course_code}</div>
                  </td>
                  <td>
                    <span className={e.payment_status === 'completed' ? styles.badgeConfirmed : styles.badgePending}>
                      {e.payment_status === 'completed'
                        ? `Đã TT (${e.payment_method === 'cash' ? 'tiền mặt' : e.payment_method === 'bank_transfer' ? 'chuyển khoản' : e.payment_method})`
                        : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td>
                    <span className={
                      e.status === 'confirmed' ? styles.badgeConfirmed :
                      e.status === 'cancelled' ? styles.badgeCancelled :
                      styles.badgePending
                    }>
                      {STATUS_LABELS[e.status] || e.status}
                    </span>
                  </td>
                  <td className={styles.sub}>{new Date(e.enrolled_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className={styles.actions}>
                      {e.status === 'pending_payment' && (
                        <button
                          className={styles.btnSecondary}
                          style={{ fontSize: 12, padding: '4px 10px' }}
                          onClick={() => confirmMutation.mutate(e.id)}
                          disabled={confirmMutation.isPending}
                          title="Xác nhận ghi danh (admin xác thực)"
                        >
                          <CheckCircle size={13} /> Xác nhận
                        </button>
                      )}
                      {e.status !== 'cancelled' && (
                        <button
                          className={`${styles.iconBtn} ${styles.danger}`}
                          onClick={() => window.confirm(`Hủy ghi danh của ${e.student_name}?`) && cancelMutation.mutate(e.id)}
                          disabled={cancelMutation.isPending}
                          title="Hủy ghi danh"
                          aria-label="Hủy ghi danh"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className={styles.empty}>Không có ghi danh nào</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>‹ Trước</button>
            <span className={styles.pageInfo}>Trang {page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Tiếp ›</button>
          </div>
        )}
      </div>

      {addModal && <AddEnrollmentModal onClose={() => setAddModal(false)} />}
    </div>
  );
}
