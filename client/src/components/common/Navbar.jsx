import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Search, ChevronDown, Menu, X, Globe, User, LogOut, LayoutDashboard } from 'lucide-react';
import { COLORS } from '../../config/site';
import { useSiteConfig } from '../../context/SiteConfigContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { SITE, NAV_ITEMS } = useSiteConfig();
  const { i18n } = useTranslation();
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

  return (
    <>
      {/* ── Level 1: Utility bar ─────────────────────── */}
      <div className={styles.utilityBar} style={{ background: COLORS.utilityBg }}>
        <div className={styles.utilityInner}>
          <span className={styles.utilityBrand}>{SITE.parentOrg}</span>
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
                  aria-haspopup="true"
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
                      <Link to="/exam-results"    className={styles.dropItem} onClick={() => setUserMenuOpen(false)}>Kết quả thi</Link>
                      <Link to="/profile"         className={styles.dropItem} onClick={() => setUserMenuOpen(false)}>Hồ sơ cá nhân</Link>
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
                <Link to="/login"    className={styles.utilityBtn}>Đăng nhập</Link>
                <Link to="/register" className={styles.utilityBtnPrimary}>Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Level 2: Main header ─────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>

          {/* Logo — cấu hình từ site.js */}
          <Link to="/" className={styles.logo} aria-label={`${SITE.name} — Trang chủ`}>
            {SITE.logoType === 'image' && SITE.logoImageUrl ? (
              <img
                src={SITE.logoImageUrl}
                alt={SITE.shortName}
                className={styles.logoImage}
                width={44}
                height={44}
              />
            ) : (
              <div className={styles.logoIcon} style={{ background: COLORS.primary }}>
                {SITE.logoMark}
              </div>
            )}
            <div className={styles.logoText}>
              <span className={styles.logoMain}>{SITE.name}</span>
              <span className={styles.logoSub}>{SITE.parentOrg}</span>
            </div>
          </Link>

          {/* Desktop nav — đọc từ NAV_ITEMS trong site.js */}
          <nav className={styles.nav} aria-label="Điều hướng chính">
            {NAV_ITEMS.map(item => (
              <div key={item.to} className={styles.navItem}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown size={13} className={styles.navChevron} aria-hidden="true" />
                  )}
                </NavLink>
                {item.children && (
                  <div className={styles.dropdown} role="menu">
                    {item.children.map(child => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={styles.dropdownItem}
                        role="menuitem"
                      >
                        {child.icon && <span className={styles.dropdownIcon} aria-hidden="true">{child.icon}</span>}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className={styles.headerActions}>
            <button
              className={styles.searchBtn}
              onClick={() => setSearchOpen(v => !v)}
              aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className={styles.searchBar} style={{ background: COLORS.primary }}>
            <form onSubmit={handleSearch} className={styles.searchForm} role="search">
              <Search size={18} className={styles.searchBarIcon} aria-hidden="true" />
              <input
                type="search"
                placeholder="Tìm kiếm khóa học..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                aria-label="Tìm kiếm"
              />
              <button type="submit" className={styles.searchSubmit}>Tìm kiếm</button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {NAV_ITEMS.map(item => (
            <div key={item.to}>
              <Link to={item.to} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
              {item.children?.map(child => (
                <Link
                  key={child.to}
                  to={child.to}
                  className={styles.mobileSub}
                  onClick={() => setMobileOpen(false)}
                >
                  {child.icon && <span aria-hidden="true">{child.icon}</span>} {child.label}
                </Link>
              ))}
            </div>
          ))}
          <div className={styles.mobileDivider} />
          {user ? (
            <>
              <Link to="/dashboard" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Tổng quan</Link>
              <Link to="/profile"   className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Hồ sơ</Link>
              {(user.role === 'super_admin' || user.role === 'staff') && (
                <Link to="/admin" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Quản trị</Link>
              )}
              <button
                className={styles.mobileLink}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                onClick={() => { handleLogout(); setMobileOpen(false); }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className={styles.mobileLink}        onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
              <Link to="/register" className={styles.mobileLinkPrimary} onClick={() => setMobileOpen(false)}>Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
