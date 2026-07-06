import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, ToggleLeft, ToggleRight, X, Search, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './AdminPage.module.css';

const ROLE_LABELS = { student: 'Sinh viên', staff: 'Nhân viên', super_admin: 'Super Admin' };
const LIMIT = 20;

export default function AdminUsers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // user object

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => api.get(`/admin/users?page=${page}&limit=${LIMIT}&search=${search}`).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/admin/users', body),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Đã tạo tài khoản'); setModal(false); reset(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Đã xóa tài khoản'); setDeleteTarget(null); },
    onError: (e) => { toast.error(e.response?.data?.error || 'Lỗi'); setDeleteTarget(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/toggle-active`),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Đã cập nhật trạng thái'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý người dùng</h1>
          <p className={styles.pageSubtitle}>{total} tài khoản</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setModal(true); reset({ role: 'staff' }); }}>
          <Plus size={16} /> Tạo tài khoản nhân viên
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.filtersBar}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-text)' }} />
            <input
              type="search" placeholder="Tìm theo tên, email, CCCD..."
              className={styles.filterInput} style={{ paddingLeft: 32, width: '100%' }}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>CCCD</th>
                <th>MSSV</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className={styles.bold}>{u.last_name} {u.first_name}</td>
                  <td className={styles.sub}>{u.email}</td>
                  <td className={styles.sub}>{u.id_number || '—'}</td>
                  <td className={styles.sub}>{u.student_code || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${u.role !== 'student' ? styles.badgeConfirmed : ''}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <span className={u.is_active ? styles.badgeConfirmed : styles.badgeCancelled}>
                      {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className={styles.sub}>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => toggleMutation.mutate(u.id)}
                        disabled={toggleMutation.isPending}
                        title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                        aria-label={u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                      >
                        {u.is_active ? <ToggleRight size={20} color="#059669" /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.danger}`}
                        onClick={() => setDeleteTarget(u)}
                        title="Xóa tài khoản"
                        aria-label="Xóa tài khoản"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={8} className={styles.empty}>Không có người dùng nào</td></tr>
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

      {deleteTarget && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal} style={{ maxWidth: 420 }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Xác nhận xóa tài khoản</h2>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)} aria-label="Đóng"><X size={20} /></button>
            </div>
            <p style={{ padding: 'var(--space-5)', color: 'var(--color-muted-text)' }}>
              Xóa vĩnh viễn tài khoản <strong>{deleteTarget.last_name} {deleteTarget.first_name}</strong> ({deleteTarget.email})?
              Hành động này không thể hoàn tác. Nếu người dùng đã có ghi danh, hãy dùng chức năng Khóa tài khoản thay thế.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className={styles.btnDanger} onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal} style={{ maxWidth: 460 }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Tạo tài khoản nhân viên</h2>
              <button className={styles.modalClose} onClick={() => setModal(false)} aria-label="Đóng"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Họ *</label>
                  <input className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                    {...register('last_name', { required: 'Bắt buộc' })} />
                  {errors.last_name && <p className={styles.error}>{errors.last_name.message}</p>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Tên *</label>
                  <input className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                    {...register('first_name', { required: 'Bắt buộc' })} />
                  {errors.first_name && <p className={styles.error}>{errors.first_name.message}</p>}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Số CCCD *</label>
                <input className={`${styles.input} ${errors.id_number ? styles.inputError : ''}`}
                  placeholder="9–12 chữ số"
                  {...register('id_number', { required: 'Bắt buộc', pattern: { value: /^\d{9,12}$/, message: '9–12 chữ số' } })} />
                {errors.id_number && <p className={styles.error}>{errors.id_number.message}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email (@hcmuaf.edu.vn) *</label>
                <input type="email" className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  {...register('email', { required: 'Bắt buộc' })} />
                {errors.email && <p className={styles.error}>{errors.email.message}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Mật khẩu tạm thời *</label>
                <input type="password" className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  {...register('password', { required: 'Bắt buộc', minLength: { value: 8, message: 'Ít nhất 8 ký tự' } })} />
                {errors.password && <p className={styles.error}>{errors.password.message}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Vai trò</label>
                <select className={styles.input} {...register('role')}>
                  <option value="staff">Nhân viên (Staff)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(false)}>Hủy</button>
                <button type="submit" className={styles.btnPrimary} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
