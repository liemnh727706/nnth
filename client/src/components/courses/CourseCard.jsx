import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import styles from './CourseCard.module.css';

const CATEGORY_LABELS = {
  foreign_language: { vi: 'Ngoại ngữ', en: 'Foreign Language' },
  informatics: { vi: 'Tin học', en: 'Informatics' },
};

const LANG_LABELS = {
  english: '🇬🇧 Tiếng Anh',
  japanese: '🇯🇵 Tiếng Nhật',
  chinese: '🇨🇳 Tiếng Trung',
  korean: '🇰🇷 Tiếng Hàn',
};

export default function CourseCard({ course }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const dateLocale = lang === 'vi' ? vi : enUS;

  const seatsLeft = course.seats_available ?? (course.max_students - course.current_students);
  const isFull = seatsLeft <= 0;
  const isLow = seatsLeft > 0 && seatsLeft <= 5;

  const name = lang === 'vi' ? course.name_vi : (course.name_en || course.name_vi);
  const catLabel = CATEGORY_LABELS[course.category]?.[lang] || course.category;

  return (
    <article className={styles.card}>
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt="" loading="lazy" width={400} height={220} />
        ) : (
          <div className={styles.thumbnailFallback} aria-hidden="true">
            <BookOpen size={40} />
          </div>
        )}
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.badgeCategory}`}>{catLabel}</span>
          {course.language_type && (
            <span className={styles.badge}>{LANG_LABELS[course.language_type] || course.language_type}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={`/courses/${course.id}`} className={styles.titleLink}>
            {name}
          </Link>
        </h3>

        {course.level && <p className={styles.level}>{course.level}</p>}

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <Calendar size={14} aria-hidden="true" />
            <time dateTime={course.start_date}>
              {format(new Date(course.start_date), 'dd/MM/yyyy', { locale: dateLocale })}
            </time>
          </div>
          <div className={styles.metaItem}>
            <Users size={14} aria-hidden="true" />
            <span
              className={isFull ? styles.full : isLow ? styles.low : ''}
              aria-label={isFull ? t('courses.seats_full') : t('courses.seats_left', { count: seatsLeft })}
            >
              {isFull ? t('courses.seats_full') : t('courses.seats_left', { count: seatsLeft })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.price}>
          {parseInt(course.tuition_fee) === 0 ? (
            <span className={styles.free}>Miễn phí</span>
          ) : (
            <span>
              <span className={styles.amount}>
                {parseInt(course.tuition_fee).toLocaleString('vi-VN')}
              </span>
              <span className={styles.currency}> đ</span>
            </span>
          )}
        </div>
        <Link
          to={`/courses/${course.id}`}
          className={`${styles.enrollBtn} ${isFull ? styles.disabled : ''}`}
          aria-disabled={isFull}
        >
          {isFull ? t('courses.seats_full') : t('courses.detail')}
        </Link>
      </div>
    </article>
  );
}
