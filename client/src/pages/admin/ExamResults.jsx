import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Upload, Eye, Globe, Download } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './AdminPage.module.css';

const mssvFromEmail = (email = '') =>
  email.toLowerCase().endsWith('@st.hcmuaf.edu.vn') ? email.split('@')[0] : null;

export default function AdminExamResults() {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [examDate, setExamDate] = useState('');

  const { data: rawResults, isLoading } = useQuery({
    queryKey: ['admin-exam-results', courseId],
    queryFn: () => api.get(`/exam-results${courseId ? `?course_id=${courseId}` : ''}`).then(r => r.data),
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses-for-exam'],
    queryFn: () => api.get('/courses?limit=50').then(r => r.data),
  });

  const results = Array.isArray(rawResults) ? rawResults : [];
  const courses = coursesData?.data || [];

  const publishMutation = useMutation({
    mutationFn: (id) => api.patch(`/exam-results/${id}/publish`),
    onSuccess: () => { qc.invalidateQueries(['admin-exam-results']); toast.success('Đã công bố kết quả'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const publishAllMutation = useMutation({
    mutationFn: () => api.patch('/exam-results/publish-all', courseId ? { course_id: courseId } : {}),
    onSuccess: (res) => { qc.invalidateQueries(['admin-exam-results']); toast.success(res.data.message); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/exam-results/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau-ket-qua-thi.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không tải được file mẫu');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!courseId || !examDate) {
      toast.error('Vui lòng chọn Khóa học và Ngày thi trước khi import');
      e.target.value = '';
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_id', courseId);
    formData.append('exam_date', examDate);
    setUploading(true);
    try {
      const res = await api.post('/exam-results/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const errCount = res.data.errors?.length || 0;
      if (res.data.imported > 0) {
        toast.success(`Import thành công ${res.data.imported} kết quả${errCount ? `, ${errCount} dòng lỗi` : ''}`);
      } else {
        toast.error(`Không import được dòng nào (${errCount} lỗi)`);
      }
      if (errCount) {
        console.warn('Import errors:', res.data.errors);
        toast.warn(`Lỗi đầu tiên: ${res.data.errors[0].row} — ${res.data.errors[0].error}`, { autoClose: 10000 });
      }
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
          <p className={styles.pageSubtitle}>{results.length} kết quả</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button className={styles.btnSecondary} onClick={downloadTemplate}>
            <Download size={16} /> Tải file mẫu
          </button>
          <button className={styles.btnSecondary} onClick={() => publishAllMutation.mutate()} disabled={publishAllMutation.isPending}>
            <Globe size={16} /> Công bố tất cả
          </button>
          <button className={styles.btnPrimary} onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={16} /> {uploading ? 'Đang import...' : 'Import Excel'}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
      </div>

      {/* Chọn khóa học + ngày thi cho import */}
      <div className={styles.tableCard} style={{ padding: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className={styles.field} style={{ minWidth: 260, flex: 1 }}>
          <label className={styles.label}>Khóa học (bắt buộc khi import) *</label>
          <select className={styles.input} value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">— Chọn khóa học —</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name_vi}</option>)}
          </select>
        </div>
        <div className={styles.field} style={{ minWidth: 180 }}>
          <label className={styles.label}>Ngày thi (bắt buộc khi import) *</label>
          <input type="date" className={styles.input} value={examDate} onChange={e => setExamDate(e.target.value)} />
        </div>
      </div>

      {/* Hướng dẫn */}
      <div style={{
        background: '#F2F9EC', border: '1px solid #C9E4B4',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
        fontSize: 14, color: '#2B6414',
      }}>
        <strong>Cách import:</strong> ① Tải file mẫu → ② Điền điểm (nhận diện sinh viên bằng <strong>MSSV hoặc CCCD</strong>,
        điểm thực hành có thể có 1–3 cột tùy môn) → ③ Chọn Khóa học + Ngày thi → ④ Import Excel.
        Kết quả ở trạng thái <em>Nháp</em> cho đến khi bấm Công bố — sinh viên chỉ xem được điểm của chính mình sau khi công bố.
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>MSSV</th>
                <th>Họ tên</th>
                <th>Ngày sinh / Nơi sinh</th>
                <th>Khóa học</th>
                <th>Trắc nghiệm</th>
                <th>Thực hành</th>
                <th>Tổng</th>
                <th>Kết quả</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const practices = Array.isArray(r.practice_scores) ? r.practice_scores : [];
                const total = r.total_score ?? r.score;
                const verdict = r.result || (total != null ? (total >= 5 ? 'Đạt' : 'Không đạt') : '—');
                return (
                  <tr key={r.id}>
                    <td className={styles.sub}>{r.student_code || mssvFromEmail(r.email) || '—'}</td>
                    <td>
                      <div className={styles.bold}>{r.last_name} {r.first_name}</div>
                      <div className={styles.sub}>{r.email}</div>
                    </td>
                    <td className={styles.sub}>
                      {r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString('vi-VN') : '—'}
                      <div>{r.place_of_birth || ''}</div>
                    </td>
                    <td className={styles.sub}>{r.course_code}</td>
                    <td>{r.theory_score ?? '—'}</td>
                    <td className={styles.sub}>
                      {practices.length ? practices.map((p, i) => <div key={i}>{p.score}</div>) : '—'}
                    </td>
                    <td className={styles.bold} style={{ fontSize: 15 }}>{total ?? '—'}</td>
                    <td>
                      <span className={verdict === 'Đạt' ? styles.badgeConfirmed : styles.badgeCancelled}>{verdict}</span>
                    </td>
                    <td>
                      <span className={r.published_at ? styles.badgeConfirmed : styles.badge}>
                        {r.published_at ? 'Đã công bố' : 'Nháp'}
                      </span>
                    </td>
                    <td>
                      {!r.published_at && (
                        <button className={styles.btnSecondary} style={{ fontSize: 12, padding: '4px 10px' }}
                          onClick={() => publishMutation.mutate(r.id)} disabled={publishMutation.isPending}>
                          <Eye size={13} /> Công bố
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!results.length && (
                <tr><td colSpan={10} className={styles.empty}>Chưa có kết quả thi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
