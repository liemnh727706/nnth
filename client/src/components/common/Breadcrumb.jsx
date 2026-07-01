import React from 'react';
import { Link, useLocation, useMatches } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import styles from './Breadcrumb.module.css';

const ROUTE_LABELS = {
  '/courses': 'Khóa học',
  '/announcements': 'Thông báo',
  '/dashboard': 'Tổng quan',
  '/my-enrollments': 'Ghi danh của tôi',
  '/exam-results': 'Kết quả thi',
  '/profile': 'Hồ sơ cá nhân',
  '/login': 'Đăng nhập',
  '/register': 'Đăng ký',
  '/admin': 'Quản trị',
  '/admin/courses': 'Quản lý khóa học',
  '/admin/enrollments': 'Quản lý ghi danh',
  '/admin/payments': 'Thanh toán',
  '/admin/exam-results': 'Kết quả thi',
  '/admin/announcements': 'Thông báo',
  '/admin/users': 'Người dùng',
};

export default function Breadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  // Don't show on home or admin pages (admin has its own sidebar)
  if (path === '/' || path.startsWith('/admin') || path.startsWith('/auth')) return null;

  // Build crumbs from path segments
  const segments = path.split('/').filter(Boolean);
  const crumbs = [{ label: 'Trang chủ', to: '/', icon: true }];

  let accumulated = '';
  for (const seg of segments) {
    accumulated += '/' + seg;
    const label = ROUTE_LABELS[accumulated] || (seg.length > 20 ? 'Chi tiết' : seg);
    crumbs.push({ label, to: accumulated });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav className={styles.breadcrumb} aria-label="Điều hướng phụ">
      <div className={styles.inner}>
        <ol className={styles.list} itemScope itemType="https://schema.org/BreadcrumbList">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li
                key={crumb.to}
                className={styles.item}
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {i > 0 && (
                  <ChevronRight size={13} className={styles.sep} aria-hidden="true" />
                )}
                {isLast ? (
                  <span className={styles.current} itemProp="name" aria-current="page">
                    {crumb.icon && <Home size={13} className={styles.homeIcon} />}
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.to} className={styles.link} itemProp="item">
                    {crumb.icon && <Home size={13} className={styles.homeIcon} />}
                    <span itemProp="name">{crumb.label}</span>
                  </Link>
                )}
                <meta itemProp="position" content={String(i + 1)} />
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
