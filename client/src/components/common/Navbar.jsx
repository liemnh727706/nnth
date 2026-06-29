import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, ChevronDown, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isAdmin = user && ['super_admin', 'staff'].includes(user.role);

  return (
    <header className={styles.header} role="banner">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="NNTH HCMUAF - Trang chủ">
          <div className={styles.logoMark}>
            <span>NN</span>
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoMain}>NNTH</span>
            <span className={styles.logoSub}>Đại học Nông Lâm TP.HCM</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink} end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/courses" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
            {t('nav.courses')}
          </NavLink>
          <NavLink to="/announcements" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
            {t('nav.announcements')}
          </NavLink>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className={styles.iconBtn}
            aria-label={`Switch to ${i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}`}
          >
            <Globe size={18} />
            <span>{i18n.language === 'vi' ? 'EN' : 'VI'}</span>
          </button>

          {user ? (
            <div className={styles.userMenu}>
              <button
                className={styles.userBtn}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className={styles.avatar} width={32} height={32} />
                ) : (
                  <div className={styles.avatarFallback}>
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                )}
                <span className={styles.userName}>{user.first_name} {user.last_name}</span>
                <ChevronDown size={16} />
              </button>

              {userMenuOpen && (
                <div className={styles.dropdown} role="menu">
                  <Link to="/dashboard" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)} role="menuitem">
                    <LayoutDashboard size={16} />
                    {t('nav.dashboard')}
                  </Link>
                  <Link to="/profile" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)} role="menuitem">
                    <User size={16} />
                    {t('nav.profile')}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)} role="menuitem">
                      <LayoutDashboard size={16} />
                      {t('nav.admin')}
                    </Link>
                  )}
                  <hr className={styles.divider} />
                  <button className={`${styles.dropdownItem} ${styles.danger}`} onClick={handleLogout} role="menuitem">
                    <LogOut size={16} />
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className={styles.loginBtn}>{t('nav.login')}</Link>
              <Link to="/register" className={styles.registerBtn}>{t('nav.register')}</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-label="Mobile navigation">
          <NavLink to="/" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('nav.home')}</NavLink>
          <NavLink to="/courses" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('nav.courses')}</NavLink>
          <NavLink to="/announcements" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('nav.announcements')}</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</NavLink>
              <NavLink to="/profile" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('nav.profile')}</NavLink>
              <button className={`${styles.mobileLink} ${styles.danger}`} onClick={handleLogout}>{t('nav.logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link>
              <Link to="/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>{t('nav.register')}</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
