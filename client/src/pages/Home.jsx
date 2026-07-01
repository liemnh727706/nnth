import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, ChevronRight, Search,
  GraduationCap, FileText, Monitor, Star,
  Users, BookOpen, Award, Globe, Bell, Clock
} from 'lucide-react';
import api from '../utils/api';
import { HERO, STATS, PROGRAMS, WHY_ITEMS, COLORS } from '../config/site';
import styles from './Home.module.css';

const ICON_MAP = { GraduationCap, FileText, Monitor, Star, Users, BookOpen, Award, Globe };

export default function Home() {
  const navigate = useNavigate();

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

  const handleHeroSearch = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      navigate(`/courses?search=${encodeURIComponent(e.target.value.trim())}`);
    }
  };

  return (
    <main>

      {/* ── HERO ─────────────────────────────────────── */}
      <section
        className={styles.hero}
        style={HERO.backgroundType === 'image' && HERO.backgroundImage
          ? { backgroundImage: `url(${HERO.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: COLORS.primary }
        }
        aria-labelledby="hero-heading"
      >
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContainer}>
          <div className={styles.heroTag}>{HERO.tag}</div>
          <h1 id="hero-heading" className={styles.heroTitle}>
            {HERO.title}<br />
            <span className={styles.heroAccent}>{HERO.titleAccent}</span>
          </h1>
          <p className={styles.heroSub}>{HERO.subtitle}</p>
          <div className={styles.heroActions}>
            <Link to={HERO.ctaPrimary.to} className={styles.heroBtn}>
              {HERO.ctaPrimary.label} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to={HERO.ctaSecondary.to} className={styles.heroBtnGhost}>
              {HERO.ctaSecondary.label}
            </Link>
          </div>
          <div className={styles.heroSearch}>
            <Search size={18} className={styles.heroSearchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder={HERO.searchPlaceholder}
              className={styles.heroSearchInput}
              onKeyDown={handleHeroSearch}
              aria-label="Tìm kiếm khóa học"
            />
            <button
              className={styles.heroSearchBtn}
              onClick={e => {
                const input = e.currentTarget.previousSibling;
                if (input.value.trim()) navigate(`/courses?search=${encodeURIComponent(input.value.trim())}`);
              }}
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────── */}
      <section className={styles.statsBar} style={{ background: COLORS.statsBg }} aria-label="Thống kê">
        <div className={styles.statsContainer}>
          {STATS.map((s, i) => (
            <div key={i} className={styles.statItem}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROGRAMS ─────────────────────────────────── */}
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
              <Link
                key={p.id}
                to={p.to}
                className={styles.programCard}
                style={{ '--accent': p.accentColor }}
              >
                {/* Ảnh minh họa */}
                {p.imageUrl ? (
                  <div className={styles.programImg}>
                    <img src={p.imageUrl} alt={p.title} loading="lazy" width={400} height={160} />
                    <div className={styles.programImgOverlay} aria-hidden="true" />
                    <span className={styles.programImgEmoji} aria-hidden="true">{p.icon}</span>
                  </div>
                ) : (
                  <div className={styles.programImgFallback} style={{ background: p.accentColor }}>
                    <span className={styles.programFallbackEmoji} aria-hidden="true">{p.icon}</span>
                  </div>
                )}
                <div className={styles.programBody}>
                  <div className={styles.programTitles}>
                    <h3 className={styles.programTitle}>{p.title}</h3>
                    <p className={styles.programSub}>{p.subtitle}</p>
                  </div>
                  <p className={styles.programDesc}>{p.desc}</p>
                  <span className={styles.programCta}>
                    Xem khóa học <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES ─────────────────────────── */}
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
              {courses.map(c => (
                <Link key={c.id} to={`/courses/${c.id}`} className={styles.courseCard}>
                  <div className={styles.courseCardBadge} data-cat={c.category}>
                    {c.category === 'foreign_language' ? (c.language_name || 'Ngoại ngữ') : 'Tin học'}
                  </div>
                  <h3 className={styles.courseCardTitle}>{c.name}</h3>
                  <p className={styles.courseCardDesc}>
                    {c.description?.slice(0, 100)}{c.description?.length > 100 ? '…' : ''}
                  </p>
                  <div className={styles.courseCardMeta}>
                    <span className={styles.courseMetaItem}>
                      <Clock size={13} aria-hidden="true" />
                      {c.schedule || 'Liên hệ lịch học'}
                    </span>
                    <span className={styles.courseMetaItem}>
                      <Users size={13} aria-hidden="true" />
                      {c.available_seats ?? '?'} chỗ còn
                    </span>
                  </div>
                  <div className={styles.courseCardFooter}>
                    <span className={styles.courseFee}>
                      {c.tuition_fee
                        ? Number(c.tuition_fee).toLocaleString('vi-VN') + ' ₫'
                        : 'Liên hệ'}
                    </span>
                    <span className={styles.courseEnroll}>
                      Đăng ký <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY US ───────────────────────────────────── */}
      <section className={styles.section} aria-labelledby="why-heading">
        <div className={styles.container}>
          <div className={styles.sectionCenter}>
            <div className={styles.sectionTag}>Tại sao chọn chúng tôi</div>
            <h2 id="why-heading" className={styles.sectionTitle}>Cam kết chất lượng</h2>
          </div>
          <div className={styles.whyGrid}>
            {WHY_ITEMS.map((item, i) => {
              const Icon = ICON_MAP[item.icon];
              return (
                <div key={i} className={styles.whyCard}>
                  {item.imageUrl ? (
                    <div className={styles.whyImgWrap}>
                      <img src={item.imageUrl} alt="" loading="lazy" className={styles.whyImg} />
                    </div>
                  ) : (
                    Icon && (
                      <div className={styles.whyIconWrap} aria-hidden="true">
                        <Icon size={26} />
                      </div>
                    )
                  )}
                  <h3 className={styles.whyTitle}>{item.title}</h3>
                  <p className={styles.whyDesc}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ────────────────────────────── */}
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
                <article key={a.id} className={styles.newsCard}>
                  {a.is_pinned && (
                    <span className={styles.newsPinned}><Bell size={11} aria-hidden="true" /> Ghim</span>
                  )}
                  <time className={styles.newsDate} dateTime={a.published_at || a.created_at}>
                    {new Date(a.published_at || a.created_at).toLocaleDateString('vi-VN')}
                  </time>
                  <h3 className={styles.newsTitle}>{a.title}</h3>
                  <p className={styles.newsExcerpt}>
                    {a.content?.slice(0, 120)}{a.content?.length > 120 ? '…' : ''}
                  </p>
                  <Link to="/announcements" className={styles.newsReadMore}>
                    Xem chi tiết <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA BANNER ───────────────────────────────── */}
      <section className={styles.ctaBanner} style={{ background: COLORS.ctaBg }} aria-labelledby="cta-heading">
        <div className={styles.container}>
          <h2 id="cta-heading" className={styles.ctaTitle}>
            Sẵn sàng bắt đầu hành trình học tập?
          </h2>
          <p className={styles.ctaSub}>
            Đăng ký ngay hôm nay để nhận tư vấn miễn phí và ưu đãi học phí dành cho sinh viên Nông Lâm.
          </p>
          <div className={styles.ctaActions}>
            <Link to="/courses"  className={styles.ctaBtn}>Xem khóa học</Link>
            <Link to="/register" className={styles.ctaBtnOutline}>Đăng ký tài khoản</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
