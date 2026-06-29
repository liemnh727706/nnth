import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './ExamResults.module.css';

export default function ExamResults() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-exam-results'],
    queryFn: () => api.get('/exam-results/my').then(r => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Kết quả thi</h1>

        {data?.results?.length ? (
          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Khóa học</th>
                    <th>Điểm</th>
                    <th>Kết quả</th>
                    <th>Nhận xét</th>
                    <th>Ngày công bố</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map(r => (
                    <tr key={r.id}>
                      <td className={styles.courseName}>{r.course_name}</td>
                      <td className={styles.score}>{r.score}</td>
                      <td>
                        <span className={`${styles.badge} ${r.score >= 5 ? styles.pass : styles.fail}`}>
                          {r.score >= 5 ? 'Đạt' : 'Không đạt'}
                        </span>
                      </td>
                      <td className={styles.remarks}>{r.remarks || '—'}</td>
                      <td className={styles.date}>{new Date(r.published_at || r.updated_at).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
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
