import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, Award, ArrowRight, MapPin, Clock } from 'lucide-react';
import api from '../utils/api';
import CourseCard from '../components/courses/CourseCard';
import styles from './Home.module.css';

export default function Home() {
  const { t } = useTranslation();

  const { data: courses } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => api.get('/courses?limit=6').then(r => r.data),
  });

  return (
    <div>
      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroBg} aria-hidden="true" />
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <MapPin size={14} />
              Đại học Nông Lâm TP.HCM
            </div>
            <h1 id="hero-heading" className={styles.heroTitle}>
              {t('home.hero_title')}
            </h1>
            <p className={styles.heroSub}>{t('home.hero_subtitle')}</p>
            <p className={styles.heroDesc}>{t('home.hero_desc')}</p>
            <div className={styles.heroCTAs}>
              <Link to="/courses" className={styles.ctaPrimary}>
                {t('home.cta_explore')}
                <ArrowRight size={18} />
              </Link>
              <Link to="/register" className={styles.ctaSecondary}>
                {t('home.cta_register')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats} aria-label="Thống kê">
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { icon: Users, value: '10,000+', label: t('home.stats_students') },
              { icon: BookOpen, value: '50+', label: t('home.stats_courses') },
              { icon: Award, value: '30+', label: t('home.stats_years') },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className={styles.statItem}>
                <div className={styles.statIcon} aria-hidden="true">
                  <Icon size={24} />
                </div>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className={styles.featuredSection} aria-labelledby="featured-heading">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 id="featured-heading" className={styles.sectionTitle}>
              {t('home.featured_courses')}
            </h2>
            <Link to="/courses" className={styles.viewAll}>
              {t('home.view_all')} <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.coursesGrid}>
            {courses?.data?.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Info section */}
      <section className={styles.infoSection}>
        <div className="container">
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <Clock size={32} className={styles.infoIcon} />
              <h3>Lịch học linh hoạt</h3>
              <p>Các lớp học được bố trí vào buổi tối và cuối tuần phù hợp với sinh viên đang theo học tại trường.</p>
            </div>
            <div className={styles.infoCard}>
              <Award size={32} className={styles.infoIcon} />
              <h3>Chứng chỉ được công nhận</h3>
              <p>Chứng chỉ Ngoại ngữ và Tin học được cấp bởi Trung tâm, đáp ứng yêu cầu chuẩn đầu ra của trường.</p>
            </div>
            <div className={styles.infoCard}>
              <Users size={32} className={styles.infoIcon} />
              <h3>Đội ngũ giảng viên</h3>
              <p>Giảng viên có trình độ chuyên môn cao, nhiều năm kinh nghiệm giảng dạy tại trường Đại học Nông Lâm.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
