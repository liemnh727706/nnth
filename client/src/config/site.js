/**
 * SITE CONFIGURATION — chỉnh sửa file này để thay đổi toàn bộ website
 * ─────────────────────────────────────────────────────────────────────
 * Sau khi sửa, React dev server tự động reload (hot-reload).
 */

/* ── 1. THÔNG TIN TRƯỜNG / LOGO ──────────────────────────────────────
 *
 * logoType: 'text'  → dùng chữ tắt (logoMark) + tên văn bản
 *           'image' → dùng file ảnh (logoImageUrl)
 */
export const SITE = {
  name: 'Trung tâm Ngoại ngữ - Tin học',
  shortName: 'NNTH',
  parentOrg: 'Đại học Nông Lâm TP.HCM',
  tagline: 'Nâng cao năng lực ngôn ngữ và công nghệ thông tin cho sinh viên và cán bộ',

  logoType: 'image',        // 'text' | 'image'
  logoMark: 'NN',           // chữ hiển thị khi logoType = 'text'
  logoImageUrl: '/logo.png', // logo chính thức từ hcmuaf.edu.vn

  // Favicon (đặt file vào public/)
  favicon: '/favicon.ico',
};

/* ── 2. MÀU SẮC TOÀN SITE ───────────────────────────────────────────
 *
 * Thay đổi các giá trị hex bên dưới → áp dụng ngay toàn site.
 *
 * Bộ màu gợi ý:
 *   Navy/Blue (hiện tại): primary=#0F172A, accent=#0369A1
 *   Green:  primary=#064E3B, accent=#059669
 *   Purple: primary=#1E1B4B, accent=#7C3AED
 *   Red:    primary=#1C0A0A, accent=#DC2626
 */
export const COLORS = {
  primary:       '#0F172A',   // Navy — tiêu đề lớn, header, sidebar admin
  primaryHover:  '#1E293B',
  accent:        '#0369A1',   // Blue — link, nút, border active
  accentHover:   '#0284C7',
  background:    '#F8FAFC',   // Nền trang
  surface:       '#FFFFFF',   // Nền card, modal
  foreground:    '#020617',   // Màu chữ chính
  mutedText:     '#64748B',   // Màu chữ phụ
  border:        '#E2E8F0',
  success:       '#16A34A',
  warning:       '#D97706',
  destructive:   '#DC2626',

  // Utility bar (thanh trên cùng)
  utilityBg:     '#0F172A',   // Nền thanh utility

  // Stats bar (thanh thống kê homepage)
  statsBg:       '#0369A1',

  // CTA banner cuối trang
  ctaBg:         '#0F172A',
};

/* ── 3. TYPOGRAPHY ──────────────────────────────────────────────────
 *
 * fontHeading: font cho tiêu đề (h1–h6)
 * fontBody:    font cho nội dung
 * Dùng tên Google Fonts chính xác.
 */
export const TYPOGRAPHY = {
  fontHeading: 'EB Garamond',
  fontBody: 'Inter',
  // Google Fonts URL — cập nhật nếu đổi font
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap',
};

/* ── 4. MENU CHÍNH (NAVBAR) ──────────────────────────────────────────
 *
 * Mỗi item có thể có `children` để tạo dropdown.
 * `to`: đường dẫn route (nội bộ) hoặc URL đầy đủ (ngoại)
 * `external`: true nếu mở tab mới
 */
export const NAV_ITEMS = [
  {
    label: 'Ngoại ngữ',
    to: '/courses?category=foreign_language',
    children: [
      { label: 'Tiếng Anh', to: '/courses?language=english', icon: '🇬🇧' },
      { label: 'Tiếng Nhật', to: '/courses?language=japanese', icon: '🇯🇵' },
      { label: 'Tiếng Trung', to: '/courses?language=chinese', icon: '🇨🇳' },
      { label: 'Tiếng Hàn',  to: '/courses?language=korean',  icon: '🇰🇷' },
    ],
  },
  {
    label: 'Tin học',
    to: '/courses?category=informatics',
    children: [
      { label: 'Tin học văn phòng', to: '/courses?category=informatics' },
      { label: 'Chuẩn đầu ra', to: '/courses?category=informatics&search=CĐR' },
      { label: 'Chứng chỉ IC3', to: '/courses?category=informatics&search=IC3' },
      { label: 'Chứng chỉ MOS', to: '/courses?category=informatics&search=MOS' },
    ],
  },
  {
    label: 'Thông báo',
    to: '/announcements',
  },
  // ── Thêm menu mới tại đây ──
  // { label: 'Lịch thi', to: '/exam-schedule' },
  // { label: 'Liên hệ', to: '/contact' },
];

/* ── 5. HOMEPAGE — HERO SECTION ──────────────────────────────────────
 *
 * backgroundType: 'gradient' | 'image'
 * backgroundImage: URL ảnh nếu dùng 'image'
 */
export const HERO = {
  tag: 'Trung tâm đào tạo chính thức',
  title: 'Trung tâm Ngoại ngữ',
  titleAccent: '& Tin học',
  subtitle:
    'Nâng cao năng lực ngôn ngữ và công nghệ thông tin — chuẩn bị hành trang cho sự nghiệp trong môi trường toàn cầu.',
  ctaPrimary:   { label: 'Khám phá khóa học', to: '/courses' },
  ctaSecondary: { label: 'Đăng ký học', to: '/register' },
  searchPlaceholder: 'Tìm kiếm khóa học, ngôn ngữ, lịch thi...',

  backgroundType: 'gradient',   // 'gradient' | 'image'
  backgroundImage: '',          // vd: 'https://images.unsplash.com/photo-...'
};

/* ── 6. HOMEPAGE — THỐNG KÊ ──────────────────────────────────────────*/
export const STATS = [
  { label: 'Học viên đã đào tạo', value: '10,000+' },
  { label: 'Khóa học đang mở',    value: '50+' },
  { label: 'Năm kinh nghiệm',     value: '20+' },
  { label: 'Đối tác doanh nghiệp', value: '100+' },
];

/* ── 7. HOMEPAGE — CHƯƠNG TRÌNH ĐÀO TẠO ─────────────────────────────
 *
 * imageUrl: URL ảnh minh họa (để trống '' sẽ dùng màu gradient)
 * accentColor: màu viền trên card
 */
export const PROGRAMS = [
  {
    id: 'english',
    icon: '🇬🇧',
    title: 'Tiếng Anh',
    subtitle: 'English Language',
    desc: 'TOEIC, IELTS, giao tiếp thương mại và học thuật cho sinh viên, cán bộ',
    to: '/courses?language=english',
    accentColor: '#1D4ED8',
    imageUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=80',
  },
  {
    id: 'japanese',
    icon: '🇯🇵',
    title: 'Tiếng Nhật',
    subtitle: 'Japanese Language',
    desc: 'Chương trình JLPT N5→N2, giao tiếp thực tế và văn hóa Nhật Bản',
    to: '/courses?language=japanese',
    accentColor: '#DC2626',
    imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80',
  },
  {
    id: 'chinese',
    icon: '🇨🇳',
    title: 'Tiếng Trung',
    subtitle: 'Chinese Language',
    desc: 'Tiếng Trung cơ bản đến nâng cao, HSK chuẩn quốc tế',
    to: '/courses?language=chinese',
    accentColor: '#B45309',
    imageUrl: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&q=80',
  },
  {
    id: 'korean',
    icon: '🇰🇷',
    title: 'Tiếng Hàn',
    subtitle: 'Korean Language',
    desc: 'TOPIK chuẩn Bộ Giáo dục Hàn Quốc, giao tiếp và văn hóa K',
    to: '/courses?language=korean',
    accentColor: '#7C3AED',
    imageUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&q=80',
  },
  {
    id: 'informatics',
    icon: '💻',
    title: 'Tin học',
    subtitle: 'Information Technology',
    desc: 'Chứng chỉ tin học văn phòng, IC3, MOS theo chuẩn quốc gia',
    to: '/courses?category=informatics',
    accentColor: '#059669',
    imageUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80',
  },
];

/* ── 8. HOMEPAGE — LÝ DO CHỌN CHÚNG TÔI ────────────────────────────*/
export const WHY_ITEMS = [
  {
    icon: 'GraduationCap',
    title: 'Đội ngũ giảng viên chất lượng',
    desc: 'Giảng viên có bằng cấp quốc tế, kinh nghiệm giảng dạy lâu năm tại Đại học Nông Lâm TP.HCM',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=300&q=80',
  },
  {
    icon: 'FileText',
    title: 'Chứng chỉ được công nhận',
    desc: 'Chứng chỉ do Trường ĐH Nông Lâm cấp, được Bộ GD&ĐT và các cơ quan tuyển dụng công nhận',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&q=80',
  },
  {
    icon: 'Monitor',
    title: 'Cơ sở vật chất hiện đại',
    desc: 'Phòng học điều hòa, máy tính cấu hình cao, phòng lab ngôn ngữ đạt chuẩn',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=80',
  },
  {
    icon: 'Star',
    title: 'Học phí hợp lý',
    desc: 'Học phí ưu đãi cho sinh viên Nông Lâm, hỗ trợ trả góp và học bổng khuyến khích',
    imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&q=80',
  },
];

/* ── 9. FOOTER ───────────────────────────────────────────────────────*/
export const FOOTER = {
  address: 'Khu phố 6, Phường Linh Trung, Thành phố Thủ Đức, TP.HCM',
  phone: '(028) 3896 3158',
  email: 'nnth@hcmuaf.edu.vn',
  website: 'https://nnth.hcmuaf.edu.vn',
  mapUrl: 'https://maps.google.com/?q=Dai+hoc+Nong+Lam+TP+HCM',
  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com/hcmuaf', label: 'Facebook' },
    // { platform: 'youtube', url: 'https://youtube.com/', label: 'YouTube' },
  ],
  copyrightYear: new Date().getFullYear(),
};
