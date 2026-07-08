import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './ExamResults.module.css';

// MSSV = phần trước @st.hcmuaf.edu.vn của email trường
const mssvFromEmail = (email = '') =>
  email.toLowerCase().endsWith('@st.hcmuaf.edu.vn') ? email.split('@')[0] : null;

export default function ExamResults() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['my-exam-results'],
    queryFn: () => api.get('/exam-results/my').then(r => r.data),
  });

  const { data: me } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  const rows = Array.isArray(results) ? results : [];
  const mssv = me?.student_code || mssvFromEmail(me?.email) || '—';

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Kết quả thi</h1>

        {/* Thông tin sinh viên */}
        {me && (
          <div className={styles.tableCard} style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 14 }}>
              <div><strong>MSSV:</strong> {mssv}</div>
              <div><strong>Họ:</strong> {me.last_name}</div>
              <div><strong>Tên:</strong> {me.first_name}</div>
              <div><strong>Ngày sinh:</strong> {me.date_of_birth ? new Date(me.date_of_birth).toLocaleDateString('vi-VN') : '—'}</div>
              <div><strong>Nơi sinh:</strong> {me.place_of_birth || '—'}</div>
            </div>
          </div>
        )}

        {rows.length ? (
          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Môn thi / Khóa học</th>
                    <th>Ngày thi</th>
                    <th>Điểm trắc nghiệm</th>
                    <th>Điểm thực hành</th>
                    <th>Điểm tổng</th>
                    <th>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const practices = Array.isArray(r.practice_scores) ? r.practice_scores : [];
                    const total = r.total_score ?? r.score;
                    const verdict = r.result || (total !== null && total !== undefined ? (total >= 5 ? 'Đạt' : 'Không đạt') : '—');
                    return (
                      <tr key={r.id}>
                        <td className={styles.courseName}>
                          {r.course_name}
                          <div style={{ fontSize: 12, color: 'var(--color-muted-text)' }}>{r.course_code}</div>
                        </td>
                        <td className={styles.date}>{r.exam_date ? new Date(r.exam_date).toLocaleDateString('vi-VN') : '—'}</td>
                        <td className={styles.score}>{r.theory_score ?? '—'}</td>
                        <td>
                          {practices.length
                            ? practices.map((p, i) => (
                                <div key={i} style={{ fontSize: 13 }}>
                                  {p.name.replace(/^Điểm thực hành\s*/i, 'TH ')}: <strong>{p.score}</strong>
                                </div>
                              ))
                            : '—'}
                        </td>
                        <td className={styles.score} style={{ fontWeight: 700 }}>{total ?? '—'}</td>
                        <td>
                          <span className={`${styles.badge} ${verdict === 'Đạt' ? styles.pass : styles.fail}`}>
                            {verdict}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.empty}>
            <FileText size={48} />
            <p>Bạn chưa có kết quả thi nào được công bố</p>
          </div>
        )}
      </div>
    </div>
  );
}
