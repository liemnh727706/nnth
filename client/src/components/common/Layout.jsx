import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Breadcrumb from './Breadcrumb';
import Footer from './Footer';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <a href="#main-content" className="skip-link">Bỏ qua điều hướng</a>
      {/* Level 1 + 2: utility bar + main nav */}
      <Navbar />
      {/* Level 3: breadcrumb sub-navigation */}
      <Breadcrumb />
      <main id="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
