import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import CourseCard from '../components/courses/CourseCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './Courses.module.css';

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Tất cả ngôn ngữ' },
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'japanese', label: 'Tiếng Nhật' },
  { value: 'chinese', label: 'Tiếng Trung' },
  { value: 'korean', label: 'Tiếng Hàn' },
];

export default function Courses() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const category = searchParams.get('category') || '';
  const language = searchParams.get('language') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page, category, language, search],
    queryFn: () => api.get(`/courses?page=${page}&limit=12&category=${category}&language_type=${language}&search=${search}`).then(r => r.data),
    keepPreviousData: true,
  });

  const setFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>{t('courses.title')}</h1>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder={t('courses.search_placeholder')}
              className={styles.searchInput}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              aria-label={t('courses.search_placeholder')}
            />
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          {/* Filters sidebar */}
          <aside className={styles.sidebar} aria-label="Bộ lọc">
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Danh mục</h3>
              {[{ value: '', label: t('courses.filter_all') }, { value: 'foreign_language', label: t('courses.filter_foreign') }, { value: 'informatics', label: t('courses.filter_it') }].map(o => (
                <label key={o.value} className={styles.filterOption}>
                  <input
                    type="radio"
                    name="category"
                    value={o.value}
                    checked={category === o.value}
                    onChange={() => setFilter('category', o.value)}
                    className={styles.radio}
                  />
                  {o.label}
                </label>
              ))}
            </div>

            {(category === 'foreign_language' || !category) && (
              <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Ngôn ngữ</h3>
                {LANGUAGE_OPTIONS.map(o => (
                  <label key={o.value} className={styles.filterOption}>
                    <input
                      type="radio"
                      name="language"
                      value={o.value}
                      checked={language === o.value}
                      onChange={() => setFilter('language', o.value)}
                      className={styles.radio}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
          </aside>

          {/* Results */}
          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <p className={styles.resultCount}>{isLoading ? 'Đang tải...' : `${data?.total || 0} khóa học`}</p>
            </div>

            {isLoading ? (
              <LoadingSpinner />
            ) : data?.courses?.length ? (
              <>
                <div className={styles.grid}>
                  {data.courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {data.totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>‹ Trước</button>
                    <span className={styles.pageInfo}>Trang {page}/{data.totalPages}</span>
                    <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Tiếp ›</button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.empty}>
                <Search size={48} />
                <p>Không tìm thấy khóa học phù hợp</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
