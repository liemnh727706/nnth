import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <div className={styles.logoMark}>NN</div>
              <div>
                <div className={styles.logoMain}>NNTH HCMUAF</div>
                <div className={styles.logoSub}>Trung tâm Ngoại ngữ - Tin học</div>
              </div>
            </div>
            <p className={styles.desc}>
              Trực thuộc Đại học Nông Lâm Thành phố Hồ Chí Minh, cung cấp các khóa học Ngoại ngữ và Tin học chất lượng cao.
            </p>
          </div>

          <div className={styles.links}>
            <h3 className={styles.linkTitle}>Khóa học</h3>
            <ul>
              <li><Link to="/courses?category=foreign_language">Ngoại ngữ</Link></li>
              <li><Link to="/courses?category=informatics">Tin học</Link></li>
              <li><Link to="/announcements?category=exam_result">Kết quả thi</Link></li>
            </ul>
          </div>

          <div className={styles.links}>
            <h3 className={styles.linkTitle}>Tài khoản</h3>
            <ul>
              <li><Link to="/login">Đăng nhập</Link></li>
              <li><Link to="/register">Đăng ký</Link></li>
              <li><Link to="/dashboard">Tổng quan</Link></li>
            </ul>
          </div>

          <div className={styles.contact}>
            <h3 className={styles.linkTitle}>Liên hệ</h3>
            <div className={styles.contactItem}>
              <MapPin size={16} aria-hidden="true" />
              <span>Khu phố 6, P. Linh Trung, TP. Thủ Đức, TP.HCM</span>
            </div>
            <div className={styles.contactItem}>
              <Phone size={16} aria-hidden="true" />
              <a href="tel:+842837244050">(028) 3724 4050</a>
            </div>
            <div className={styles.contactItem}>
              <Mail size={16} aria-hidden="true" />
              <a href="mailto:nnth@hcmuaf.edu.vn">nnth@hcmuaf.edu.vn</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} Trung tâm Ngoại ngữ - Tin học, Đại học Nông Lâm TP.HCM</p>
          <p>Website: <a href="https://nnth.hcmuaf.edu.vn">nnth.hcmuaf.edu.vn</a></p>
        </div>
      </div>
    </footer>
  );
}
