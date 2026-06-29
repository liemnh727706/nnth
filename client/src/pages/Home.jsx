import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Users, Award, ArrowRight, Clock,
  Globe, Monitor, Star, ChevronRight, GraduationCap,
  FileText, Bell, Search
} from 'lucide-react';
import api from '../utils/api';
import styles from './Home.module.css';

const PROGRAMS = [
  {
    id: 'english',
    icon: '🇬🇧',
    title: 'Tiếng Anh',
    subtitle: 'English Language',
    desc: 'TOEIC, IELTS, giao tiếp thương mại và học thuật cho sinh viên, cán bộ',
    to: '/courses?language=english',
    color: '#1D4ED8',
  },
  {
    id: 'japanese',
    icon: '🇯🇵',
    title: 'Tiếng Nhật',
    subtitle: 'Japanese Language',
    desc: 'Chương trình JLPT N5→N2, giao tiếp thực tế và văn hóa Nhật Bản',
    to: '/courses?language=japanese',
    color: '#DC2626',
  },
  {
    id: 'chinese',
    icon: '🇨🇳',
    title: 'Tiếng Trung',
    subtitle: 'Chinese Language',
    desc: 'Tiếng Trung cơ bản đến nâng cao, HSK chuẩn quốc tế',
    to: '/courses?language=chinese',
    color: '#B45309',
  },
  {
    id: 'korean',
    icon: '🇰🇷',
    title: 'Tiếng Hàn',
    subtitle: 'Korean Language',
    desc: 'TOPIK chuẩn bộ giáo dục Hàn Quốc, giao tiếp và văn hóa K',
    to: '/courses?language=korean',
    color: '#7C3AED',
  },
  {
    id: 'informatics',
    icon: '💻',
    title: 'Tin học',
    subtitle: 'Information Technology',
    desc: 'Chứng chỉ tin học văn phòng, IC3, MOS theo chuẩn quốc gia',
    to: '/courses?category=informatics',
    color: '#059669',
  },
];

const STATS = [
  { label: 'Học viên đã đào tạo', value: '10,000+', icon: <Users size={20} /> },
  { label: 'Khóa học đang mở', value: '50+', icon: <BookOpen size={20} /> },
  { label: 'Năm kinh nghiệm', value: '20+', icon: <Award size={20} /> },
  { label: 'Đối tác doanh nghiệp', value: '100+', icon: <Globe size={20} /> },
];

const WHY_ITEMS = [
  {
    icon: <GraduationCap size={28} />,
    title: 'Đội ngũ giảng viên chất lượng',
    desc: 'Giảng viên có bằng cấp quốc tế, kinh nghiệm giảng dạy lâu năm tại Đại học Nông Lâm TP.HCM',
  },
  {
    icon: <FileText size={28} />,
    title: 'Chứng chỉ được công nhận',
    desc: 'Chứng chỉ do Trường ĐH Nông Lâm cấp, được Bộ GD&ĐT và các cơ quan tuyển dụng công nhận',
  },
  {
    icon: <Monitor size={28} />,
    title: 'Cơ sở vật chất hiện đại',
    desc: 'Phòng học điều hòa, máy tính cấu hình cao, phòng lab ngôn ngữ đạt chuẩn',
  },
  {
    icon: <Star size={28} />,
    title: 'Học phí hợp lý',
    desc: 'Học phí ưu đãi cho sinh viên Nông Lâm, hỗ trợ trả góp và học bổng khuyến khích',
  },
];

export default function Home() {
  const { data: coursesData } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => api.get('/courses?limit=6').then(r => r.data),
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['latest-announcements'],
    queryFn: () => api.get('/announcements?limit=4').then(r => r.data),
  });

  const courses = coursesData?.courses || [];
  const announcements = announcementsData?.announcements || [];

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContainer}>
          <div className={styles.heroTag}>Trung tâm đào tạo chính thức</div>
          <h1 id="hero-heading" className={styles.heroTitle}>
            Trung tâm Ngoại ngữ<br />
            <span className={styles.heroAccent}>&amp; Tin học</span>
          </h1>
          <p className={styles.heroSub}>
            Nâng cao năng lực ngôn ngữ và công nghệ thông tin —<br className={styles.heroBreak} />
            chuẩn bị hành trang cho sự nghiệp trong môi trường toàn cầu.
          </p>
          <div className={styles.heroActions}>
            <Link to="/courses" className={styles.heroBtn}>
              Khám phá khóa học <ArrowRight size={18} />
            </Link>
            <Link to="/register" className={styles.heroBtnGhost}>
              Đăng ký học
            </Link>
          </div>

          {/* Hero search */}
          <div className={styles.heroSearch}>
            <Search size={18} className={styles.heroSearchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder="Tìm kiếm khóa học, ngôn ngữ, lịch thi..."
              className={styles.heroSearchInput}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  window.location.href = `/courses?search=${encodeURIComponent(e.target.value.trim())}`;
                }
              }}
              aria-label="Tìm kiếm khóa học"
            />
            <button
              className={styles.heroSearchBtn}
              onClick={e => {
                const input = e.currentTarget.previousSibling;
                if (input.value.trim()) {
                  window.location.href = `/courses?search=${encodeURIComponent(input.value.trim())}`;
                }
              }}
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section className={styles.statsBar} aria-label="Thống kê">
        <div className={styles.statsContainer}>
          {STATS.map(s => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statIcon} aria-hidden="true">{s.icon}</span>
              <div>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROGRAMS GRID ────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="programs-heading">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTag}>Chương trình đào tạo</div>
              <h2 id="programs-heading" className={styles.sectionTitle}>Lĩnh vực học tập</h2>
            </div>
            <Link to="/courses" className={styles.sectionLink}>
              Xem tất cả <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.programsGrid}>
            {PROGRAMS.map(p => (
              <Link key={p.id} to={p.to} className={styles.programCard} style={{ '--accent': p.color }}>
                <div className={styles.programCardTop}>
                  <span className={styles.programEmoji} aria-hidden="true">{p.icon}</span>
                  <div className={styles.programArrow} aria-hidden="true"><ArrowRight size={16} /></div>
                </div>
                <h3 className={styles.programTitle}>{p.title}</h3>
                <p className={styles.programSub}>{p.subtitle}</p>
                <p className={styles.programDesc}>{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES ─────────────────────────────── */}
      {courses.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="courses-heading">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTag}>Đang chiêu sinh</div>
                <h2 id="courses-heading" className={styles.sectionTitle}>Khóa học nổi bật</h2>
              </div>
              <Link to="/courses" className={styles.sectionLink}>
                Xem tất cả <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className={styles.coursesGrid}>
              {courses.map(course => (
                <Link key={course.id} to={`/courses/${course.id}`} className={styles.courseCard}>
                  <div className={styles.courseCardBadge} data-cat={course.category}>
                    {course.category === 'foreign_language' ? course.language_name || 'Ngoại ngữ' : 'Tin học'}
                  </div>
                  <h3 className={styles.courseCardTitle}>{course.name}</h3>
                  <p className={styles.courseCardDesc}>{course.description?.slice(0, 100)}{course.description?.length > 100 ? '…' : ''}</p>
                  <div className={styles.courseCardMeta}>
                    <span className={styles.courseMetaItem}>
                      <Clock size={13} aria-hidden="true" />
                      {course.schedule || 'Liên hệ lịch học'}
                    </span>
                    <span className={styles.courseMetaItem}>
                      <Users size={13} aria-hidden="true" />
                      {course.available_seats ?? '?'} chỗ còn
                    </span>
                  </div>
                  <div className={styles.courseCardFooter}>
                    <span className={styles.courseFee}>
                      {course.tuition_fee ? Number(course.tuition_fee).toLocaleString('vi-VN') + ' ₫' : 'Liên hệ'}
                    </span>
                    <span className={styles.courseEnroll}>Đăng ký <ArrowRight size={13} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY US ───────────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="why-heading">
        <div className={styles.container}>
          <div className={styles.sectionCenter}>
            <div className={styles.sectionTag}>Tại sao chọn chúng tôi</div>
            <h2 id="why-heading" className={styles.sectionTitle}>Cam kết chất lượng</h2>
          </div>
          <div className={styles.whyGrid}>
            {WHY_ITEMS.map((item, i) => (
              <div key={i} className={styles.whyCard}>
                <div className={styles.whyIcon} aria-hidden="true">{item.icon}</div>
                <h3 className={styles.whyTitle}>{item.title}</h3>
                <p className={styles.whyDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ────────────────────────────────── */}
      {announcements.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="news-heading">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.sectionTag}>Thông tin mới nhất</div>
                <h2 id="news-heading" className={styles.sectionTitle}>Thông báo</h2>
              </div>
              <Link to="/announcements" className={styles.sectionLink}>
                Xem tất cả <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.newsGrid}>
              {announcements.map(a => (
                <div key={a.id} className={styles.newsCard}>
                  {a.is_pinned && <span className={styles.newsPinned}><Bell size={12} /> Ghim</span>}
                  <div className={styles.newsDate}>
                    {new Date(a.published_at || a.created_at).toLocaleDateString('vi-VN')}
                  </div>
                  <h3 className={styles.newsTitle}>{a.title}</h3>
                  <p className={styles.newsExcerpt}>{a.content?.slice(0, 120)}{a.content?.length > 120 ? '…' : ''}</p>
                  <Link to="/announcements" className={styles.newsReadMore}>
                    Xem chi tiết <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className={styles.ctaBanner} aria-labelledby="cta-heading">
        <div className={styles.container}>
          <h2 id="cta-heading" className={styles.ctaTitle}>Sẵn sàng bắt đầu hành trình học tập?</h2>
          <p className={styles.ctaSub}>Đăng ký ngay hôm nay để nhận tư vấn miễn phí và ưu đãi học phí dành cho sinh viên Nông Lâm.</p>
          <div className={styles.ctaActions}>
            <Link to="/courses" className={styles.ctaBtn}>Xem khóa học</Link>
            <Link to="/register" className={styles.ctaBtnOutline}>Đăng ký tài khoản</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
