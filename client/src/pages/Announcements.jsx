import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Pin } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './Announcements.module.css';

const CATEGORIES = [
  { value: '', label: 'Tất cả' },
  { value: 'general', label: 'Chung' },
  { value: 'exam_result', label: 'Kết quả thi' },
  { value: 'enrollment', label: 'Ghi danh' },
  { value: 'schedule', label: 'Lịch học' },
];

export default function Announcements() {
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', category],
    queryFn: () => api.get(`/announcements?category=${category}&limit=50`).then(r => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Thông báo</h1>

        <div className={styles.tabs}>
          {CATEGORIES.map(c => (
            <button key={c.value} className={`${styles.tab} ${category === c.value ? styles.activeTab : ''}`} onClick={() => setCategory(c.value)}>
              {c.label}
            </button>
          ))}
        </div>

        {data?.announcements?.length ? (
          <div className={styles.list}>
            {data.announcements.map(a => (
              <article key={a.id} className={`${styles.item} ${a.is_pinned ? styles.pinned : ''}`} onClick={() => setSelected(a)}>
                {a.is_pinned && <div className={styles.pinLabel}><Pin size={13} /> Ghim</div>}
                <div className={styles.itemMeta}>
                  <span className={styles.category}>{CATEGORIES.find(c => c.value === a.category)?.label || a.category}</span>
                  <span className={styles.date}>{new Date(a.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <h2 className={styles.itemTitle}>{a.title}</h2>
                <p className={styles.itemPreview}>{a.content.substring(0, 200)}{a.content.length > 200 ? '...' : ''}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}><Bell size={48} /><p>Chưa có thông báo</p></div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)} role="dialog" aria-modal="true">
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalMeta}>
              <span className={styles.category}>{CATEGORIES.find(c => c.value === selected.category)?.label}</span>
              <span className={styles.date}>{new Date(selected.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <h2 className={styles.modalTitle}>{selected.title}</h2>
            <div className={styles.modalContent}>{selected.content}</div>
            <button className={styles.closeBtn} onClick={() => setSelected(null)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
