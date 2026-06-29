import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Upload, Eye, EyeOff, Globe } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './AdminPage.module.css';

export default function AdminExamResults() {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exam-results', page],
    queryFn: () => api.get(`/exam-results?page=${page}&limit=20`).then(r => r.data),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => api.patch(`/exam-results/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries(['admin-exam-results']); toast.success('Đã công bố kết quả'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const publishAllMutation = useMutation({
    mutationFn: () => api.patch('/exam-results/publish-all'),
    onSuccess: () => { qc.invalidateQueries(['admin-exam-results']); toast.success('Đã công bố tất cả kết quả'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await api.post('/exam-results/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Import thành công ${res.data.imported} kết quả`);
      qc.invalidateQueries(['admin-exam-results']);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Kết quả thi</h1>
          <p className={styles.pageSubtitle}>{data?.total || 0} kết quả</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className={styles.btnSecondary} onClick={() => publishAllMutation.mutate()} disabled={publishAllMutation.isLoading}>
            <Globe size={16} /> Công bố tất cả
          </button>
          <button className={styles.btnPrimary} onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={16} /> {uploading ? 'Đang import...' : 'Import Excel'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Template hint */}
      <div style={{
        background: '#EFF6FF', border: '1px solid #BFDBFE',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
        fontSize: 14, color: '#1D4ED8',
      }}>
        <strong>Định dạng file Excel:</strong> Cột A: Số CCCD | Cột B: Tên khóa học | Cột C: Điểm | Cột D: Nhận xét (tuỳ chọn)
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>CCCD</th>
                <th>Khóa học</th>
                <th>Điểm</th>
                <th>Nhận xét</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.results?.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className={styles.bold}>{r.last_name} {r.first_name}</div>
                    <div className={styles.sub}>{r.email}</div>
                  </td>
                  <td className={styles.sub}>{r.id_number}</td>
                  <td>{r.course_name}</td>
                  <td className={styles.bold} style={{ fontSize: 16 }}>{r.score}</td>
                  <td className={styles.sub}>{r.remarks || '—'}</td>
                  <td>
                    <span className={r.is_published ? styles.badgePublished : styles.badgeDraft}>
                      {r.is_published ? 'Đã công bố' : 'Nháp'}
                    </span>
                  </td>
                  <td>
                    {!r.is_published && (
                      <button
                        className={styles.btnSuccess}
                        onClick={() => publishMutation.mutate(r.id)}
                        disabled={publishMutation.isLoading}
                      >
                        <Eye size={14} /> Công bố
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!data?.results?.length && (
                <tr><td colSpan={7} className={styles.empty}>Chưa có kết quả thi</td></tr>
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
