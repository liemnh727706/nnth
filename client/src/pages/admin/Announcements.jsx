import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './AdminPage.module.css';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'Chung' },
  { value: 'exam_result', label: 'Kết quả thi' },
  { value: 'enrollment', label: 'Ghi danh' },
  { value: 'schedule', label: 'Lịch học' },
];

const LIMIT = 20;

export default function AdminAnnouncements() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['admin-announcements', page],
    queryFn: () => api.get(`/announcements?page=${page}&limit=${LIMIT}`).then(r => r.data),
  });

  // Server trả về array trực tiếp
  const announcements = Array.isArray(rawData) ? rawData : (rawData?.data || []);
  const total = rawData?.total || announcements.length;
  const totalPages = Math.ceil(total / LIMIT);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/announcements', { ...body, publish_now: true }),
    onSuccess: () => { qc.invalidateQueries(['admin-announcements']); toast.success('Đã đăng thông báo'); setModal(null); reset(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/announcements/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['admin-announcements']); toast.success('Đã cập nhật'); setModal(null); reset(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/announcements/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-announcements']); toast.success('Đã xóa'); setDeleteId(null); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const openEdit = (item) => {
    setModal(item);
    reset({
      title_vi: item.title_vi,
      title_en: item.title_en || '',
      content_vi: item.content_vi,
      content_en: item.content_en || '',
      category: item.category,
      is_pinned: item.is_pinned,
    });
  };

  const onSubmit = (data) => {
    if (modal === 'create') createMutation.mutate(data);
    else updateMutation.mutate({ id: modal.id, ...data, published_at: modal.published_at || new Date().toISOString() });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Thông báo</h1>
          <p className={styles.pageSubtitle}>{total} thông báo</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setModal('create'); reset({ category: 'general', is_pinned: false }); }}>
          <Plus size={16} /> Thêm thông báo
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Danh mục</th>
                <th>Ghim</th>
                <th>Ngày đăng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map(a => (
                <tr key={a.id}>
                  <td className={styles.bold}>{a.title_vi}</td>
                  <td><span className={styles.badge}>{CATEGORY_OPTIONS.find(c => c.value === a.category)?.label || a.category}</span></td>
                  <td>{a.is_pinned ? '📌 Ghim' : '—'}</td>
                  <td className={styles.sub}>{new Date(a.published_at || a.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => openEdit(a)} aria-label="Sửa"><Edit2 size={15} /></button>
                      <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteId(a.id)} aria-label="Xóa"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!announcements.length && (
                <tr><td colSpan={5} className={styles.empty}>Chưa có thông báo</td></tr>
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

      {modal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{modal === 'create' ? 'Thêm thông báo' : 'Chỉnh sửa thông báo'}</h2>
              <button className={styles.modalClose} onClick={() => setModal(null)} aria-label="Đóng"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Tiêu đề (Tiếng Việt) *</label>
                <input className={`${styles.input} ${errors.title_vi ? styles.inputError : ''}`}
                  {...register('title_vi', { required: 'Bắt buộc' })} />
                {errors.title_vi && <p className={styles.error}>{errors.title_vi.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Tiêu đề (Tiếng Anh)</label>
                <input className={styles.input} {...register('title_en')} />
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Danh mục</label>
                  <select className={styles.input} {...register('category')}>
                    {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className={styles.field} style={{ justifyContent: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 'auto', paddingBottom: 4 }}>
                    <input type="checkbox" {...register('is_pinned')} style={{ width: 16, height: 16 }} />
                    <span className={styles.label}>📌 Ghim thông báo</span>
                  </label>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nội dung (Tiếng Việt) *</label>
                <textarea
                  className={`${styles.input} ${styles.textarea} ${errors.content_vi ? styles.inputError : ''}`}
                  rows={8}
                  {...register('content_vi', { required: 'Nội dung là bắt buộc' })}
                />
                {errors.content_vi && <p className={styles.error}>{errors.content_vi.message}</p>}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(null)}>Hủy</button>
                <button type="submit" className={styles.btnPrimary}
                  disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu & Đăng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal} style={{ maxWidth: 400 }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Xác nhận xóa</h2>
              <button className={styles.modalClose} onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <p style={{ padding: 'var(--space-5)', color: 'var(--color-muted-text)' }}>Bạn có chắc muốn xóa thông báo này?</p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteId(null)}>Hủy</button>
              <button className={styles.btnDanger} onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
