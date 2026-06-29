import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Search, ChevronDown, Menu, X, Globe, User, LogOut, LayoutDashboard } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/courses?category=foreign_language', label: 'Ngoại ngữ', sub: [
      { to: '/courses?language=english', label: 'Tiếng Anh' },
      { to: '/courses?language=japanese', label: 'Tiếng Nhật' },
      { to: '/courses?language=chinese', label: 'Tiếng Trung' },
      { to: '/courses?language=korean', label: 'Tiếng Hàn' },
    ]},
    { to: '/courses?category=informatics', label: 'Tin học' },
    { to: '/announcements', label: 'Thông báo' },
  ];

  return (
    <>
      {/* Utility bar - như MIT top strip */}
      <div className={styles.utilityBar}>
        <div className={styles.utilityInner}>
          <span className={styles.utilityBrand}>Đại học Nông Lâm TP.HCM</span>
          <div className={styles.utilityRight}>
            <button className={styles.utilityBtn} onClick={toggleLang} aria-label="Chuyển ngôn ngữ">
              <Globe size={13} />
              {i18n.language === 'vi' ? 'EN' : 'VI'}
            </button>
            {user ? (
              <div className={styles.userMenuWrap}>
                <button
                  className={styles.utilityBtn}
                  onClick={() => setUserMenuOpen(v => !v)}
                  aria-expanded={userMenuOpen}
                >
                  <User size={13} /> {user.first_name} <ChevronDown size={11} />
                </button>
                {userMenuOpen && (
                  <>
                    <div className={styles.dropOverlay} onClick={() => setUserMenuOpen(false)} />
                    <div className={styles.userDropdown}>
                      <Link to="/dashboard" className={styles.dropItem} onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard size={14} /> Tổng quan
                      </Link>
                      <Link to="/my-enrollments" className={styles.dropItem} onClick={() => setUserMenuOpen(false)}>Ghi danh của tôi</Link>
                      <Link to="/exam-results" className={styles.dropItem} onClick={() => setUserMenuOpen(false)}>Kết quả thi</Link>
                      <Link to="/profile" className={styles.dropItem} onClick={() => setUserMenuOpen(false)}>Hồ sơ cá nhân</Link>
                      {(user.role === 'super_admin' || user.role === 'staff') && (
                        <Link to="/admin" className={styles.dropItem} onClick={() => setUserMenuOpen(false)}>Quản trị</Link>
                      )}
                      <div className={styles.dropDivider} />
                      <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                        <LogOut size={14} /> Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className={styles.utilityBtn}>Đăng nhập</Link>
                <Link to="/register" className={styles.utilityBtnPrimary}>Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo} aria-label="Trang chủ">
            <div className={styles.logoIcon}>NN</div>
            <div className={styles.logoText}>
              <span className={styles.logoMain}>Trung tâm Ngoại ngữ &amp; Tin học</span>
              <span className={styles.logoSub}>Đại học Nông Lâm TP.HCM</span>
            </div>
          </Link>

          <nav className={styles.nav} aria-label="Điều hướng chính">
            {navLinks.map(link => (
              <div key={link.to} className={styles.navItem}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                  {link.label}
                  {link.sub && <ChevronDown size={13} className={styles.navChevron} aria-hidden="true" />}
                </NavLink>
                {link.sub && (
                  <div className={styles.dropdown}>
                    {link.sub.map(s => (
                      <Link key={s.to} to={s.to} className={styles.dropdownItem}>{s.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <button className={styles.searchBtn} onClick={() => setSearchOpen(v => !v)} aria-label="Tìm kiếm">
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className={styles.searchBar}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <Search size={18} className={styles.searchBarIcon} aria-hidden="true" />
              <input
                type="search"
                placeholder="Tìm kiếm khóa học..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className={styles.searchSubmit}>Tìm kiếm</button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map(link => (
            <div key={link.to}>
              <Link to={link.to} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>{link.label}</Link>
              {link.sub?.map(s => (
                <Link key={s.to} to={s.to} className={styles.mobileSub} onClick={() => setMobileOpen(false)}>{s.label}</Link>
              ))}
            </div>
          ))}
          <div className={styles.mobileDivider} />
          {user ? (
            <>
              <Link to="/dashboard" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Tổng quan</Link>
              <Link to="/profile" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Hồ sơ</Link>
              <button className={styles.mobileLink} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { handleLogout(); setMobileOpen(false); }}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
              <Link to="/register" className={styles.mobileLinkPrimary} onClick={() => setMobileOpen(false)}>Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
