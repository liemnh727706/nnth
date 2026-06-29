import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './AdminPage.module.css';

const CATEGORIES = [
  { value: 'foreign_language', label: 'Ngoại ngữ' },
  { value: 'informatics', label: 'Tin học' },
];
const LANGUAGES = [
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'japanese', label: 'Tiếng Nhật' },
  { value: 'chinese', label: 'Tiếng Trung' },
  { value: 'korean', label: 'Tiếng Hàn' },
];

export default function AdminCourses() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'create' | course object (edit)
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', page],
    queryFn: () => api.get(`/courses?page=${page}&limit=20`).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/courses', body),
    onSuccess: () => { qc.invalidateQueries(['admin-courses']); toast.success('Đã thêm khóa học'); setModal(null); reset(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/courses/${id}`, body),
    onSuccess: () => { qc.invalidateQueries(['admin-courses']); toast.success('Đã cập nhật'); setModal(null); reset(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/courses/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-courses']); toast.success('Đã xóa khóa học'); setDeleteId(null); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const openEdit = (course) => {
    setModal(course);
    reset({
      name: course.name,
      description: course.description,
      category: course.category,
      language_type: course.language_type,
      start_date: course.start_date?.substring(0, 10),
      end_date: course.end_date?.substring(0, 10),
      tuition_fee: course.tuition_fee,
      max_students: course.max_students,
      schedule: course.schedule,
    });
  };

  const onSubmit = (data) => {
    if (modal === 'create') createMutation.mutate(data);
    else updateMutation.mutate({ id: modal.id, ...data });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Quản lý khóa học</h1>
          <p className={styles.pageSubtitle}>{data?.total || 0} khóa học</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setModal('create'); reset({}); }}>
          <Plus size={16} /> Thêm khóa học
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên khóa học</th>
                <th>Loại</th>
                <th>Thời gian</th>
                <th>Học phí</th>
                <th>Sĩ số</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.courses?.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.bold}>{c.name}</div>
                    {c.language_type && <div className={styles.sub}>{LANGUAGES.find(l => l.value === c.language_type)?.label}</div>}
                  </td>
                  <td><span className={styles.badge}>{c.category === 'foreign_language' ? 'Ngoại ngữ' : 'Tin học'}</span></td>
                  <td className={styles.sub}>
                    {c.start_date && new Date(c.start_date).toLocaleDateString('vi-VN')} —{' '}
                    {c.end_date && new Date(c.end_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td>{Number(c.tuition_fee).toLocaleString('vi-VN')} đ</td>
                  <td>{c.current_students}/{c.max_students}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} onClick={() => openEdit(c)} aria-label="Sửa"><Edit2 size={15} /></button>
                      <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => setDeleteId(c.id)} aria-label="Xóa"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>‹ Trước</button>
            <span className={styles.pageInfo}>Trang {page}/{data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Tiếp ›</button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={modal === 'create' ? 'Thêm khóa học' : 'Sửa khóa học'}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{modal === 'create' ? 'Thêm khóa học mới' : 'Chỉnh sửa khóa học'}</h2>
              <button className={styles.modalClose} onClick={() => setModal(null)} aria-label="Đóng"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Tên khóa học *</label>
                <input className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  {...register('name', { required: 'Bắt buộc' })} />
                {errors.name && <p className={styles.error}>{errors.name.message}</p>}
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Danh mục *</label>
                  <select className={styles.input} {...register('category', { required: true })}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Ngôn ngữ</label>
                  <select className={styles.input} {...register('language_type')}>
                    <option value="">— Không —</option>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Ngày bắt đầu *</label>
                  <input type="date" className={styles.input} {...register('start_date', { required: true })} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Ngày kết thúc *</label>
                  <input type="date" className={styles.input} {...register('end_date', { required: true })} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Học phí (VNĐ) *</label>
                  <input type="number" min="0" className={styles.input} {...register('tuition_fee', { required: true })} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Sĩ số tối đa *</label>
                  <input type="number" min="1" className={styles.input} {...register('max_students', { required: true })} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Lịch học</label>
                <input className={styles.input} placeholder="VD: Thứ 2-4-6, 18:00–20:00" {...register('schedule')} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Mô tả</label>
                <textarea className={`${styles.input} ${styles.textarea}`} rows={3} {...register('description')} />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModal(null)}>Hủy</button>
                <button type="submit" className={styles.btnPrimary}
                  disabled={createMutation.isLoading || updateMutation.isLoading}>
                  {createMutation.isLoading || updateMutation.isLoading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal} style={{ maxWidth: 400 }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Xác nhận xóa</h2>
              <button className={styles.modalClose} onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <p style={{ padding: 'var(--space-5)', color: 'var(--color-muted-text)' }}>
              Khóa học này sẽ bị ẩn khỏi hệ thống. Bạn có chắc chắn?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteId(null)}>Hủy</button>
              <button className={styles.btnDanger} onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isLoading}>
                {deleteMutation.isLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
