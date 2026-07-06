import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, X, ArrowRight, Circle, Users, Clock } from 'lucide-react';
import api from '../utils/api';
import styles from './Courses.module.css';

/* ── Filter dropdown options ───────────────────────── */
const CATEGORY_OPTS = [
  { value: '', label: 'Tất cả danh mục' },
  { value: 'foreign_language', label: 'Ngoại ngữ' },
  { value: 'informatics', label: 'Tin học' },
];

const LANGUAGE_OPTS = [
  { value: '', label: 'Tất cả ngôn ngữ' },
  { value: 'vietnamese', label: 'Tiếng Việt' },
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'japanese', label: 'Tiếng Nhật' },
  { value: 'chinese', label: 'Tiếng Trung' },
  { value: 'korean', label: 'Tiếng Hàn' },
];

const STATUS_OPTS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'open', label: 'Đang chiêu sinh' },
  { value: 'upcoming', label: 'Sắp khai giảng' },
  { value: 'closed', label: 'Đã đóng' },
];

const DELIVERY_OPTS = [
  { value: '', label: 'Hình thức học' },
  { value: 'offline', label: 'Offline' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Kết hợp' },
];

/* ── Reusable dropdown component ───────────────────── */
function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);
  const isActive = value !== '';

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={`${styles.dropdown} ${isActive ? styles.dropdownActive : ''}`} ref={ref}>
      <button
        className={styles.dropdownTrigger}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        type="button"
      >
        <span className={styles.dropdownLabel}>
          {isActive ? selected?.label : label}
        </span>
        {isActive ? (
          <X
            size={14}
            className={styles.dropdownClear}
            onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}
            aria-label="Xóa bộ lọc"
          />
        ) : (
          <ChevronDown size={14} className={`${styles.dropdownChevron} ${open ? styles.open : ''}`} />
        )}
      </button>

      {open && (
        <ul className={styles.dropdownMenu} role="listbox" aria-label={label}>
          {options.map(opt => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              className={`${styles.dropdownItem} ${value === opt.value ? styles.dropdownItemSelected : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Status badge ──────────────────────────────────── */
function StatusBadge({ seats }) {
  if (seats === null || seats === undefined) return <span className={`${styles.badge} ${styles.badgeGray}`}>—</span>;
  if (seats <= 0) return <span className={`${styles.badge} ${styles.badgeRed}`}><Circle size={7} fill="currentColor" /> Hết chỗ</span>;
  if (seats <= 5) return <span className={`${styles.badge} ${styles.badgeOrange}`}><Circle size={7} fill="currentColor" /> Gần đầy</span>;
  return <span className={`${styles.badge} ${styles.badgeGreen}`}><Circle size={7} fill="currentColor" /> Còn chỗ</span>;
}

/* ── Main component ────────────────────────────────── */
export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);

  const category = searchParams.get('category') || '';
  const language = searchParams.get('language') || '';
  const status = searchParams.get('status') || '';
  const delivery = searchParams.get('delivery') || '';

  // Đồng bộ khi URL thay đổi từ menu điều hướng (component đã mount sẵn)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearch(urlSearch);
    setInputVal(urlSearch);
    setPage(1);
  }, [searchParams]);

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params, { replace: true });
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal);
    setPage(1);
  };

  const clearAll = () => {
    setSearchParams({}, { replace: true });
    setSearch('');
    setInputVal('');
    setPage(1);
  };

  const hasFilters = category || language || status || delivery || search;

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page, category, language, status, delivery, search],
    queryFn: () =>
      api.get(`/courses`, {
        params: { page, limit: 15, category, language_type: language, status, delivery_mode: delivery, search },
      }).then(r => r.data),
    keepPreviousData: true,
  });

  const courses = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15) || 1;

  const catLabel = (c) =>
    c === 'foreign_language' ? 'Ngoại ngữ' : c === 'informatics' ? 'Tin học' : '—';

  const langLabel = (l) => {
    const m = { english: 'Tiếng Anh', japanese: 'Tiếng Nhật', chinese: 'Tiếng Trung', korean: 'Tiếng Hàn' };
    return m[l] || '—';
  };

  return (
    <div className={styles.page}>

      {/* ── Level 3: Page header (MIT-style) ─────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>DANH MỤC KHÓA HỌC</h1>
            <p className={styles.pageDesc}>
              Khám phá các chương trình ngoại ngữ và tin học được giảng dạy bởi đội ngũ giảng viên
              Đại học Nông Lâm TP.HCM — đạt chuẩn quốc gia và quốc tế.
            </p>
          </div>
          <div className={styles.pageHeaderImg} aria-hidden="true">
            <div className={styles.pageHeaderImgGrid}>
              {['NN', 'TH', 'EN', 'JP'].map(t => (
                <div key={t} className={styles.pageHeaderImgCell}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarInner}>
          {/* Dropdowns */}
          <div className={styles.filterDropdowns}>
            <FilterDropdown
              label="Danh mục"
              options={CATEGORY_OPTS}
              value={category}
              onChange={v => setFilter('category', v)}
            />
            <FilterDropdown
              label="Ngôn ngữ"
              options={LANGUAGE_OPTS}
              value={language}
              onChange={v => setFilter('language', v)}
            />
            <FilterDropdown
              label="Trạng thái"
              options={STATUS_OPTS}
              value={status}
              onChange={v => setFilter('status', v)}
            />
            <FilterDropdown
              label="Hình thức học"
              options={DELIVERY_OPTS}
              value={delivery}
              onChange={v => setFilter('delivery', v)}
            />
          </div>

          {/* Search */}
          <form className={styles.filterSearch} onSubmit={handleSearch} role="search">
            <Search size={16} className={styles.filterSearchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder="Tìm kiếm khóa học..."
              className={styles.filterSearchInput}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              aria-label="Tìm kiếm khóa học"
            />
          </form>
        </div>

        {/* Active filters summary */}
        {hasFilters && (
          <div className={styles.activeFilters}>
            <div className={styles.activeFiltersInner}>
              <span className={styles.activeFiltersLabel}>Bộ lọc đang áp dụng:</span>
              {category && <span className={styles.activeTag}>{catLabel(category)}</span>}
              {language && <span className={styles.activeTag}>{langLabel(language)}</span>}
              {status && <span className={styles.activeTag}>{STATUS_OPTS.find(o=>o.value===status)?.label}</span>}
              {search && <span className={styles.activeTag}>"{search}"</span>}
              <button className={styles.clearAll} onClick={clearAll}>
                <X size={13} /> Xóa tất cả
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ───────────────────────────────────── */}
      <div className={styles.content}>
        <div className={styles.contentInner}>

          {/* Result count */}
          <div className={styles.resultMeta}>
            {isLoading
              ? <span>Đang tải...</span>
              : <span>Hiển thị <strong>{courses.length}</strong> / <strong>{total}</strong> khóa học</span>
            }
          </div>

          {isLoading ? (
            <div className={styles.skeleton}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className={styles.empty}>
              <Search size={40} aria-hidden="true" />
              <p>Không tìm thấy khóa học phù hợp với bộ lọc đã chọn.</p>
              <button className={styles.emptyReset} onClick={clearAll}>Xóa bộ lọc</button>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className={styles.tableWrap}>
                <table className={styles.table} aria-label="Danh sách khóa học">
                  <thead>
                    <tr>
                      <th className={styles.thCourse} scope="col">KHÓA HỌC</th>
                      <th scope="col">DANH MỤC</th>
                      <th scope="col">NGÔN NGỮ</th>
                      <th scope="col">LỊCH HỌC</th>
                      <th scope="col">CHỖ CÒN</th>
                      <th scope="col">HỌC PHÍ</th>
                      <th scope="col">TRẠNG THÁI</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id} className={styles.tableRow}>
                        <td className={styles.tdCourse}>
                          <Link to={`/courses/${c.id}`} className={styles.courseName}>
                            {c.name}
                          </Link>
                          {c.description && (
                            <p className={styles.courseDesc}>
                              {c.description.slice(0, 90)}{c.description.length > 90 ? '…' : ''}
                            </p>
                          )}
                        </td>
                        <td className={styles.tdMeta}>
                          <span className={styles.catTag} data-cat={c.category}>
                            {catLabel(c.category)}
                          </span>
                        </td>
                        <td className={styles.tdMeta}>
                          {c.language_type ? langLabel(c.language_type) : '—'}
                        </td>
                        <td className={styles.tdMeta}>
                          <span className={styles.scheduleCell}>
                            {c.schedule || <span className={styles.muted}>Liên hệ</span>}
                          </span>
                        </td>
                        <td className={styles.tdMeta}>
                          <span className={styles.seatsCell}>
                            <Users size={13} aria-hidden="true" />
                            {c.available_seats ?? '?'}
                          </span>
                        </td>
                        <td className={styles.tdMeta}>
                          <span className={styles.fee}>
                            {c.tuition_fee
                              ? Number(c.tuition_fee).toLocaleString('vi-VN') + ' ₫'
                              : <span className={styles.muted}>Liên hệ</span>}
                          </span>
                        </td>
                        <td className={styles.tdMeta}>
                          <StatusBadge seats={c.available_seats} />
                        </td>
                        <td className={styles.tdAction}>
                          <Link to={`/courses/${c.id}`} className={styles.enrollBtn}>
                            Xem <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="Phân trang">
                  <button
                    className={styles.pageBtn}
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    aria-label="Trang trước"
                  >
                    ‹ Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce((acc, n, i, arr) => {
                      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === '…'
                        ? <span key={`e${i}`} className={styles.pageEllipsis}>…</span>
                        : <button
                            key={item}
                            className={`${styles.pageBtn} ${item === page ? styles.pageBtnActive : ''}`}
                            onClick={() => setPage(item)}
                            aria-label={`Trang ${item}`}
                            aria-current={item === page ? 'page' : undefined}
                          >
                            {item}
                          </button>
                    )
                  }

                  <button
                    className={styles.pageBtn}
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    aria-label="Trang tiếp"
                  >
                    Tiếp ›
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
