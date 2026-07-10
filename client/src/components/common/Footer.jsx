import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Youtube, MessageCircle, ExternalLink } from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';
import styles from './Footer.module.css';

export default function Footer() {
  const { SITE, FOOTER } = useSiteConfig();

  const socials = [
    { url: FOOTER.facebook, icon: Facebook, label: 'Facebook' },
    { url: FOOTER.zalo, icon: MessageCircle, label: 'Zalo' },
    { url: FOOTER.youtube, icon: Youtube, label: 'YouTube' },
  ].filter(s => s.url);

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <div className={styles.logoMark}>{SITE.logoMark || 'NN'}</div>
              <div>
                <div className={styles.logoMain}>{SITE.shortName} HCMUAF</div>
                <div className={styles.logoSub}>{SITE.name}</div>
              </div>
            </div>
            <p className={styles.desc}>{FOOTER.description}</p>
            {socials.length > 0 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {socials.map(({ url, icon: Icon, label }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 36, height: 36, borderRadius: 8,
                      background: 'rgba(255,255,255,0.15)', color: '#fff',
                    }}>
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            )}
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
              {FOOTER.mapUrl ? (
                <a href={FOOTER.mapUrl} target="_blank" rel="noopener noreferrer" title="Mở bản đồ">
                  {FOOTER.address} <ExternalLink size={11} style={{ display: 'inline' }} />
                </a>
              ) : (
                <span>{FOOTER.address}</span>
              )}
            </div>
            <div className={styles.contactItem}>
              <Phone size={16} aria-hidden="true" />
              <a href={`tel:${(FOOTER.phone || '').replace(/[^\d+]/g, '')}`}>{FOOTER.phone}</a>
            </div>
            <div className={styles.contactItem}>
              <Mail size={16} aria-hidden="true" />
              <a href={`mailto:${FOOTER.email}`}>{FOOTER.email}</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} {SITE.name}, {SITE.parentOrg}</p>
          <p>Website: <a href={FOOTER.website}>{(FOOTER.website || '').replace(/^https?:\/\//, '')}</a></p>
        </div>
      </div>
    </footer>
  );
}
