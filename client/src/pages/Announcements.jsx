import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['announcements', category],
    queryFn: () => api.get(`/announcements?category=${category}&limit=50`).then(r => r.data),
  });

  const announcements = rawData?.data || (Array.isArray(rawData) ? rawData : []);

  // Mở chi tiết thông báo khi truy cập bằng liên kết /announcements?id=... (từ trang chủ)
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && announcements.length) {
      const found = announcements.find(a => String(a.id) === id);
      if (found) setSelected(found);
    }
  }, [searchParams, announcements]);

  const closeDetail = () => {
    setSelected(null);
    if (searchParams.get('id')) setSearchParams({}, { replace: true });
  };

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

        {announcements.length ? (
          <div className={styles.list}>
            {announcements.map(a => (
              <article key={a.id} className={`${styles.item} ${a.is_pinned ? styles.pinned : ''}`} onClick={() => setSelected(a)}>
                {a.is_pinned && <div className={styles.pinLabel}><Pin size={13} /> Ghim</div>}
                <div className={styles.itemMeta}>
                  <span className={styles.category}>{CATEGORIES.find(c => c.value === a.category)?.label || a.category}</span>
                  <span className={styles.date}>{new Date(a.published_at || a.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <h2 className={styles.itemTitle}>{a.title_vi}</h2>
                <p className={styles.itemPreview}>{(a.content_vi || '').substring(0, 200)}{(a.content_vi || '').length > 200 ? '...' : ''}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}><Bell size={48} /><p>Chưa có thông báo</p></div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className={styles.overlay} onClick={closeDetail} role="dialog" aria-modal="true">
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalMeta}>
              <span className={styles.category}>{CATEGORIES.find(c => c.value === selected.category)?.label}</span>
              <span className={styles.date}>{new Date(selected.published_at || selected.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <h2 className={styles.modalTitle}>{selected.title_vi}</h2>
            <div className={styles.modalContent}>{selected.content_vi}</div>

            {/* File đính kèm: ảnh hiển thị trực tiếp, PDF nhúng khung xem */}
            {selected.attachments?.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {selected.attachments.map((att, i) => (
                  <div key={i}>
                    {att.type === 'image' ? (
                      <img src={att.url} alt={att.name}
                        style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--color-border)' }} />
                    ) : (
                      <div>
                        <iframe src={att.url} title={att.name}
                          style={{ width: '100%', height: 480, border: '1px solid var(--color-border)', borderRadius: 8 }} />
                        <a href={att.url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', marginTop: 6, fontSize: 13, color: 'var(--color-accent)' }}>
                          📄 Mở {att.name} trong tab mới
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className={styles.closeBtn} onClick={closeDetail}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
