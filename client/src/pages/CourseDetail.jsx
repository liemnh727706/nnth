import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Calendar, Users, DollarSign, Clock, ChevronLeft } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import styles from './CourseDetail.module.css';

const PAYMENT_METHODS = [
  { value: 'stripe', label: 'Thẻ quốc tế (Stripe/Visa/Mastercard)' },
  { value: 'vnpay', label: 'VNPay' },
  { value: 'momo', label: 'MoMo' },
  { value: 'zalopay', label: 'ZaloPay' },
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng (Admin xác nhận)' },
];

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState('vnpay');
  const [enrolling, setEnrolling] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then(r => r.data),
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.post('/enrollments', { course_id: id }),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['my-enrollments-summary']);
      setShowPayment(true);
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Ghi danh thất bại'),
  });

  const handlePay = async () => {
    if (!user) { navigate('/login?redirect=' + encodeURIComponent(window.location.pathname)); return; }
    if (enrollMutation.data) {
      await initiatePayment(enrollMutation.data.data?.enrollment?.id);
    } else {
      enrollMutation.mutate();
    }
  };

  const initiatePayment = async (enrollmentId) => {
    setEnrolling(true);
    try {
      if (selectedMethod === 'vnpay') {
        const res = await api.post('/payments/vnpay/create', { enrollment_id: enrollmentId });
        window.location.href = res.data.paymentUrl;
      } else if (selectedMethod === 'momo') {
        const res = await api.post('/payments/momo/create', { enrollment_id: enrollmentId });
        window.location.href = res.data.paymentUrl;
      } else if (selectedMethod === 'zalopay') {
        const res = await api.post('/payments/zalopay/create', { enrollment_id: enrollmentId });
        window.location.href = res.data.paymentUrl;
      } else if (selectedMethod === 'stripe') {
        const res = await api.post('/payments/stripe/create-intent', { enrollment_id: enrollmentId });
        navigate(`/payment/result?status=pending&intent=${res.data.clientSecret}`);
      } else if (selectedMethod === 'bank_transfer') {
        toast.info('Vui lòng chuyển khoản theo thông tin ngân hàng và chờ admin xác nhận trong 1-2 ngày làm việc.');
        navigate('/my-enrollments');
      }
    } catch {
      toast.error('Không thể khởi tạo thanh toán');
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!course) return <div className={styles.page}><p style={{ padding: 'var(--space-8)' }}>Không tìm thấy khóa học.</p></div>;

  const seatsLeft = course.max_students - course.current_students;
  const isFull = seatsLeft <= 0;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className="container">
          <Link to="/courses" className={styles.back}><ChevronLeft size={18} /> Danh sách khóa học</Link>
          <h1 className={styles.title}>{course.name}</h1>
          <div className={styles.badges}>
            <span className={styles.badge}>{course.category === 'foreign_language' ? 'Ngoại ngữ' : 'Tin học'}</span>
            {course.language_type && <span className={styles.badge}>{course.language_type}</span>}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          {/* Main */}
          <div className={styles.main}>
            {course.description && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Giới thiệu</h2>
                <p className={styles.desc}>{course.description}</p>
              </div>
            )}

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Thông tin khóa học</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <Calendar size={18} aria-hidden="true" />
                  <div>
                    <div className={styles.infoLabel}>Thời gian học</div>
                    <div className={styles.infoValue}>
                      {course.start_date && new Date(course.start_date).toLocaleDateString('vi-VN')} —{' '}
                      {course.end_date && new Date(course.end_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                {course.schedule && (
                  <div className={styles.infoItem}>
                    <Clock size={18} aria-hidden="true" />
                    <div>
                      <div className={styles.infoLabel}>Lịch học</div>
                      <div className={styles.infoValue}>{course.schedule}</div>
                    </div>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <Users size={18} aria-hidden="true" />
                  <div>
                    <div className={styles.infoLabel}>Sĩ số</div>
                    <div className={styles.infoValue}>{course.current_students}/{course.max_students} (còn {seatsLeft} chỗ)</div>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <DollarSign size={18} aria-hidden="true" />
                  <div>
                    <div className={styles.infoLabel}>Học phí</div>
                    <div className={styles.infoValue}>{Number(course.tuition_fee).toLocaleString('vi-VN')} VNĐ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar CTA */}
          <aside className={styles.aside}>
            <div className={styles.ctaCard}>
              <div className={styles.ctaPrice}>{Number(course.tuition_fee).toLocaleString('vi-VN')} đ</div>

              {isFull ? (
                <div className={styles.fullBadge}>Hết chỗ</div>
              ) : (
                <>
                  <div className={styles.seatsBar}>
                    <div className={styles.seatsText}>
                      Còn <strong>{seatsLeft}</strong>/{course.max_students} chỗ trống
                    </div>
                    <div className={styles.seatsTrack}>
                      <div className={styles.seatsFill} style={{ width: `${(course.current_students / course.max_students) * 100}%` }} />
                    </div>
                  </div>

                  <div className={styles.paymentSection}>
                    <p className={styles.payLabel}>Phương thức thanh toán</p>
                    <div className={styles.payMethods}>
                      {PAYMENT_METHODS.map(m => (
                        <label key={m.value} className={`${styles.payOption} ${selectedMethod === m.value ? styles.paySelected : ''}`}>
                          <input
                            type="radio"
                            name="payment_method"
                            value={m.value}
                            checked={selectedMethod === m.value}
                            onChange={() => setSelectedMethod(m.value)}
                            className={styles.payRadio}
                          />
                          {m.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    className={styles.enrollBtn}
                    onClick={handlePay}
                    disabled={enrolling || enrollMutation.isLoading}
                  >
                    {enrolling || enrollMutation.isLoading ? 'Đang xử lý...' : 'Ghi danh & Thanh toán'}
                  </button>

                  {!user && (
                    <p className={styles.loginHint}>
                      <Link to="/login">Đăng nhập</Link> để ghi danh
                    </p>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
