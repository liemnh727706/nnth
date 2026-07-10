import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Save, Upload, Plus, Trash2, RotateCcw } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  SITE as SITE_DEFAULT, HERO as HERO_DEFAULT, STATS as STATS_DEFAULT,
  PROGRAMS as PROGRAMS_DEFAULT, WHY_ITEMS as WHY_DEFAULT, FOOTER as FOOTER_DEFAULT,
} from '../../config/site';
import styles from './AdminPage.module.css';

const DEFAULTS = {
  SITE: SITE_DEFAULT, HERO: HERO_DEFAULT, STATS: STATS_DEFAULT,
  PROGRAMS: PROGRAMS_DEFAULT, WHY_ITEMS: WHY_DEFAULT, FOOTER: FOOTER_DEFAULT,
};

/* ── Ô nhập ảnh: URL + nút upload ─────────────────────── */
function ImageField({ label, value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/site-settings/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data.url);
      toast.success('Đã tải ảnh lên');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi tải ảnh');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input className={styles.input} value={value || ''} placeholder="URL ảnh hoặc bấm Tải ảnh"
          onChange={e => onChange(e.target.value)} style={{ flex: 1 }} />
        <button type="button" className={styles.btnSecondary} style={{ whiteSpace: 'nowrap' }}
          onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload size={14} /> {uploading ? 'Đang tải...' : 'Tải ảnh'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>
      {value && <img src={value} alt="" style={{ marginTop: 8, maxHeight: 60, borderRadius: 6, border: '1px solid #E2E8F0' }} />}
    </div>
  );
}

function TextField({ label, value, onChange, textarea }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {textarea ? (
        <textarea className={`${styles.input} ${styles.textarea}`} rows={2} value={value || ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <input className={styles.input} value={value || ''} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

function SectionCard({ title, children, onReset }) {
  return (
    <div className={styles.tableCard} style={{ marginBottom: 24, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h2>
        {onReset && (
          <button type="button" className={styles.btnSecondary} onClick={onReset} title="Khôi phục mặc định">
            <RotateCcw size={13} /> Mặc định
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AdminSiteContent() {
  const qc = useQueryClient();
  const [config, setConfig] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings-admin'],
    queryFn: () => api.get('/site-settings').then(r => r.data),
  });

  useEffect(() => {
    if (data !== undefined && config === null) {
      // Merge overrides từ DB lên defaults để hiển thị giá trị hiện hành
      const merged = {};
      for (const key of Object.keys(DEFAULTS)) {
        const def = DEFAULTS[key];
        const ov = data?.[key];
        merged[key] = Array.isArray(def) ? (ov || def) : { ...def, ...(ov || {}) };
      }
      setConfig(merged);
    }
  }, [data, config]);

  const saveMutation = useMutation({
    mutationFn: (body) => api.put('/site-settings', body),
    onSuccess: () => {
      qc.invalidateQueries(['site-settings']);
      qc.invalidateQueries(['site-settings-admin']);
      toast.success('Đã lưu nội dung website');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi khi lưu'),
  });

  if (isLoading || !config) return <LoadingSpinner />;

  const set = (section, field, value) =>
    setConfig(c => ({ ...c, [section]: { ...c[section], [field]: value } }));

  const setArrItem = (section, idx, field, value) =>
    setConfig(c => ({
      ...c,
      [section]: c[section].map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));

  const addArrItem = (section, template) =>
    setConfig(c => ({ ...c, [section]: [...c[section], template] }));

  const removeArrItem = (section, idx) =>
    setConfig(c => ({ ...c, [section]: c[section].filter((_, i) => i !== idx) }));

  const resetSection = (section) =>
    setConfig(c => ({ ...c, [section]: DEFAULTS[section] }));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Nội dung website</h1>
          <p className={styles.pageSubtitle}>Chỉnh sửa tiêu đề, hình ảnh, nút bấm hiển thị trên trang chủ</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => saveMutation.mutate(config)}
          disabled={saveMutation.isPending}>
          <Save size={16} /> {saveMutation.isPending ? 'Đang lưu...' : 'Lưu tất cả'}
        </button>
      </div>

      {/* ── Thông tin chung / Logo ── */}
      <SectionCard title="🏫 Thông tin chung & Logo" onReset={() => resetSection('SITE')}>
        <div className={styles.formRow}>
          <TextField label="Tên trung tâm" value={config.SITE.name} onChange={v => set('SITE', 'name', v)} />
          <TextField label="Tên viết tắt" value={config.SITE.shortName} onChange={v => set('SITE', 'shortName', v)} />
        </div>
        <TextField label="Đơn vị chủ quản" value={config.SITE.parentOrg} onChange={v => set('SITE', 'parentOrg', v)} />
        <ImageField label="Logo (hiển thị trên thanh menu)" value={config.SITE.logoImageUrl} onChange={v => set('SITE', 'logoImageUrl', v)} />
      </SectionCard>

      {/* ── Hero ── */}
      <SectionCard title="🎯 Trang chủ — Banner chính (Hero)" onReset={() => resetSection('HERO')}>
        <TextField label="Nhãn nhỏ phía trên" value={config.HERO.tag} onChange={v => set('HERO', 'tag', v)} />
        <div className={styles.formRow}>
          <TextField label="Tiêu đề dòng 1" value={config.HERO.title} onChange={v => set('HERO', 'title', v)} />
          <TextField label="Tiêu đề dòng 2 (màu nhấn)" value={config.HERO.titleAccent} onChange={v => set('HERO', 'titleAccent', v)} />
        </div>
        <TextField label="Mô tả phụ" textarea value={config.HERO.subtitle} onChange={v => set('HERO', 'subtitle', v)} />
        <div className={styles.formRow}>
          <TextField label="Nút chính — chữ" value={config.HERO.ctaPrimary?.label}
            onChange={v => set('HERO', 'ctaPrimary', { ...config.HERO.ctaPrimary, label: v })} />
          <TextField label="Nút chính — liên kết" value={config.HERO.ctaPrimary?.to}
            onChange={v => set('HERO', 'ctaPrimary', { ...config.HERO.ctaPrimary, to: v })} />
        </div>
        <div className={styles.formRow}>
          <TextField label="Nút phụ — chữ" value={config.HERO.ctaSecondary?.label}
            onChange={v => set('HERO', 'ctaSecondary', { ...config.HERO.ctaSecondary, label: v })} />
          <TextField label="Nút phụ — liên kết" value={config.HERO.ctaSecondary?.to}
            onChange={v => set('HERO', 'ctaSecondary', { ...config.HERO.ctaSecondary, to: v })} />
        </div>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Kiểu nền</label>
            <select className={styles.input} value={config.HERO.backgroundType}
              onChange={e => set('HERO', 'backgroundType', e.target.value)}>
              <option value="gradient">Màu (mặc định)</option>
              <option value="image">Ảnh nền cố định</option>
              <option value="slideshow">Slideshow (2–5 ảnh tự chuyển)</option>
            </select>
          </div>
        </div>
        {config.HERO.backgroundType === 'image' && (
          <ImageField label="Ảnh nền banner" value={config.HERO.backgroundImage} onChange={v => set('HERO', 'backgroundImage', v)} />
        )}
        {config.HERO.backgroundType === 'slideshow' && (
          <>
            {(config.HERO.backgroundImages || []).map((url, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <ImageField label={`Ảnh slideshow #${i + 1}`} value={url}
                    onChange={v => set('HERO', 'backgroundImages',
                      config.HERO.backgroundImages.map((u, j) => j === i ? v : u))} />
                </div>
                <button type="button" className={`${styles.iconBtn} ${styles.danger}`} style={{ marginBottom: 14 }}
                  disabled={(config.HERO.backgroundImages || []).length <= 2}
                  onClick={() => set('HERO', 'backgroundImages',
                    config.HERO.backgroundImages.filter((_, j) => j !== i))}
                  aria-label="Xóa ảnh"><Trash2 size={15} /></button>
              </div>
            ))}
            {(config.HERO.backgroundImages || []).length < 5 && (
              <button type="button" className={styles.btnSecondary}
                onClick={() => set('HERO', 'backgroundImages', [...(config.HERO.backgroundImages || []), ''])}>
                <Plus size={14} /> Thêm ảnh ({(config.HERO.backgroundImages || []).length}/5)
              </button>
            )}
            <div className={styles.field} style={{ marginTop: 12, maxWidth: 260 }}>
              <label className={styles.label}>Thời gian chuyển ảnh (giây)</label>
              <input type="number" min="3" max="20" className={styles.input}
                value={(config.HERO.slideshowInterval || 6000) / 1000}
                onChange={e => set('HERO', 'slideshowInterval', Math.max(3, parseInt(e.target.value) || 6) * 1000)} />
            </div>
          </>
        )}
      </SectionCard>

      {/* ── Stats ── */}
      <SectionCard title="📊 Trang chủ — Thống kê" onReset={() => resetSection('STATS')}>
        {config.STATS.map((s, i) => (
          <div key={i} className={styles.formRow} style={{ alignItems: 'flex-end' }}>
            <TextField label={`Giá trị #${i + 1}`} value={s.value} onChange={v => setArrItem('STATS', i, 'value', v)} />
            <TextField label="Nhãn" value={s.label} onChange={v => setArrItem('STATS', i, 'label', v)} />
            <button type="button" className={`${styles.iconBtn} ${styles.danger}`} style={{ marginBottom: 14 }}
              onClick={() => removeArrItem('STATS', i)} aria-label="Xóa"><Trash2 size={15} /></button>
          </div>
        ))}
        <button type="button" className={styles.btnSecondary} onClick={() => addArrItem('STATS', { value: '', label: '' })}>
          <Plus size={14} /> Thêm thống kê
        </button>
      </SectionCard>

      {/* ── Programs ── */}
      <SectionCard title="🎓 Trang chủ — Lĩnh vực học tập" onReset={() => resetSection('PROGRAMS')}>
        {config.PROGRAMS.map((p, i) => (
          <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>#{i + 1} — {p.title || '(chưa có tiêu đề)'}</strong>
              <button type="button" className={`${styles.iconBtn} ${styles.danger}`}
                onClick={() => removeArrItem('PROGRAMS', i)} aria-label="Xóa"><Trash2 size={15} /></button>
            </div>
            <div className={styles.formRow}>
              <TextField label="Tiêu đề" value={p.title} onChange={v => setArrItem('PROGRAMS', i, 'title', v)} />
              <TextField label="Phụ đề" value={p.subtitle} onChange={v => setArrItem('PROGRAMS', i, 'subtitle', v)} />
            </div>
            <TextField label="Mô tả" textarea value={p.desc} onChange={v => setArrItem('PROGRAMS', i, 'desc', v)} />
            <div className={styles.formRow}>
              <TextField label="Icon (emoji)" value={p.icon} onChange={v => setArrItem('PROGRAMS', i, 'icon', v)} />
              <TextField label="Liên kết khi bấm" value={p.to} onChange={v => setArrItem('PROGRAMS', i, 'to', v)} />
            </div>
            <ImageField label="Ảnh minh họa" value={p.imageUrl} onChange={v => setArrItem('PROGRAMS', i, 'imageUrl', v)} />
          </div>
        ))}
        <button type="button" className={styles.btnSecondary}
          onClick={() => addArrItem('PROGRAMS', { id: `new-${Date.now()}`, icon: '📘', title: '', subtitle: '', desc: '', to: '/courses', accentColor: 'var(--color-accent)', imageUrl: '' })}>
          <Plus size={14} /> Thêm lĩnh vực
        </button>
      </SectionCard>

      {/* ── Why items ── */}
      <SectionCard title="⭐ Trang chủ — Lý do chọn chúng tôi" onReset={() => resetSection('WHY_ITEMS')}>
        {config.WHY_ITEMS.map((w, i) => (
          <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>#{i + 1} — {w.title || '(chưa có tiêu đề)'}</strong>
              <button type="button" className={`${styles.iconBtn} ${styles.danger}`}
                onClick={() => removeArrItem('WHY_ITEMS', i)} aria-label="Xóa"><Trash2 size={15} /></button>
            </div>
            <TextField label="Tiêu đề" value={w.title} onChange={v => setArrItem('WHY_ITEMS', i, 'title', v)} />
            <TextField label="Mô tả" textarea value={w.desc} onChange={v => setArrItem('WHY_ITEMS', i, 'desc', v)} />
            <ImageField label="Ảnh minh họa" value={w.imageUrl} onChange={v => setArrItem('WHY_ITEMS', i, 'imageUrl', v)} />
          </div>
        ))}
        <button type="button" className={styles.btnSecondary}
          onClick={() => addArrItem('WHY_ITEMS', { icon: 'Star', title: '', desc: '', imageUrl: '' })}>
          <Plus size={14} /> Thêm lý do
        </button>
      </SectionCard>

      {/* ── Footer ── */}
      <SectionCard title="📞 Chân trang — Thông tin liên hệ" onReset={() => resetSection('FOOTER')}>
        <TextField label="Mô tả ngắn về trung tâm" textarea value={config.FOOTER.description} onChange={v => set('FOOTER', 'description', v)} />
        <TextField label="Địa chỉ" value={config.FOOTER.address} onChange={v => set('FOOTER', 'address', v)} />
        <TextField label="Location — link Google Maps (bấm vào địa chỉ sẽ mở bản đồ)" value={config.FOOTER.mapUrl} onChange={v => set('FOOTER', 'mapUrl', v)} />
        <div className={styles.formRow}>
          <TextField label="Điện thoại" value={config.FOOTER.phone} onChange={v => set('FOOTER', 'phone', v)} />
          <TextField label="Email" value={config.FOOTER.email} onChange={v => set('FOOTER', 'email', v)} />
        </div>
        <TextField label="Website" value={config.FOOTER.website} onChange={v => set('FOOTER', 'website', v)} />
        <div className={styles.formRow}>
          <TextField label="Facebook (URL)" value={config.FOOTER.facebook} onChange={v => set('FOOTER', 'facebook', v)} />
          <TextField label="Zalo (URL)" value={config.FOOTER.zalo} onChange={v => set('FOOTER', 'zalo', v)} />
        </div>
        <TextField label="YouTube (URL)" value={config.FOOTER.youtube} onChange={v => set('FOOTER', 'youtube', v)} />
        <p style={{ fontSize: 12, color: 'var(--color-muted-text)' }}>Để trống URL mạng xã hội nào thì icon đó sẽ ẩn khỏi chân trang.</p>
      </SectionCard>

      <div style={{ position: 'sticky', bottom: 16, textAlign: 'right' }}>
        <button className={styles.btnPrimary} onClick={() => saveMutation.mutate(config)}
          disabled={saveMutation.isPending} style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          <Save size={16} /> {saveMutation.isPending ? 'Đang lưu...' : 'Lưu tất cả'}
        </button>
      </div>
    </div>
  );
}
