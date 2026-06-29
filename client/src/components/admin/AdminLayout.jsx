import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Users, CreditCard,
  FileText, Megaphone, Menu, X, LogOut, ChevronRight,
} from 'lucide-react';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const navItems = [
    { to: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/courses', label: t('admin.courses'), icon: BookOpen },
    { to: '/admin/enrollments', label: t('admin.enrollments'), icon: Users },
    { to: '/admin/payments', label: t('admin.payments'), icon: CreditCard },
    { to: '/admin/exam-results', label: t('admin.exam_results'), icon: FileText },
    { to: '/admin/announcements', label: t('admin.announcements'), icon: Megaphone },
    ...(isSuperAdmin ? [{ to: '/admin/users', label: t('admin.users'), icon: Users }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`} aria-label="Admin navigation">
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>NN</div>
            <div>
              <div className={styles.logoMain}>NNTH Admin</div>
              <div className={styles.logoSub}>{isSuperAdmin ? 'Super Admin' : 'Staff'}</div>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight size={14} className={styles.chevron} aria-hidden="true" />
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div>
              <div className={styles.userName}>{user?.first_name} {user?.last_name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>
          <div className={styles.topbarRight}>
            <NavLink to="/" className={styles.viewSite} target="_blank" rel="noopener noreferrer">
              Xem trang web
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content} id="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
