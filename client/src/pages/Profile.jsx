import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');

  const { register: regProfile, handleSubmit: submitProfile, formState: { errors: errP } } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      date_of_birth: user?.date_of_birth?.substring(0, 10) || '',
      place_of_birth: user?.place_of_birth || '',
      student_code: user?.student_code || '',
    },
  });

  const { register: regPass, handleSubmit: submitPass, reset: resetPass, formState: { errors: errPw }, watch } = useForm();
  const newPassword = watch('new_password');

  const profileMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: ({ data }) => { updateUser(data); toast.success('Đã cập nhật hồ sơ'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.put('/users/change-password', data),
    onSuccess: () => { toast.success('Đã đổi mật khẩu'); resetPass(); },
    onError: (e) => toast.error(e.response?.data?.error || 'Sai mật khẩu hiện tại'),
  });

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.avatar}>{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
            <div>
              <h1 className={styles.name}>{user?.last_name} {user?.first_name}</h1>
              <p className={styles.email}>{user?.email}</p>
              {user?.id_number && <p className={styles.idNum}>CCCD: {user.id_number}</p>}
            </div>
          </div>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'profile' ? styles.active : ''}`} onClick={() => setTab('profile')}>Thông tin cá nhân</button>
            <button className={`${styles.tab} ${tab === 'password' ? styles.active : ''}`} onClick={() => setTab('password')}>Đổi mật khẩu</button>
          </div>

          {tab === 'profile' && (
            <form onSubmit={submitProfile(d => profileMutation.mutate(d))} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Họ</label>
                  <input className={styles.input} {...regProfile('last_name')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Tên</label>
                  <input className={styles.input} {...regProfile('first_name')} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Ngày sinh</label>
                  <input type="date" className={styles.input} {...regProfile('date_of_birth')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Nơi sinh</label>
                  <input className={styles.input} {...regProfile('place_of_birth')} />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Mã sinh viên</label>
                <input className={styles.input} {...regProfile('student_code')} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={profileMutation.isLoading}>
                {profileMutation.isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={submitPass(d => passwordMutation.mutate(d))} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Mật khẩu hiện tại *</label>
                <input type="password" className={`${styles.input} ${errPw.current_password ? styles.inputError : ''}`}
                  {...regPass('current_password', { required: 'Bắt buộc' })} />
                {errPw.current_password && <p className={styles.error}>{errPw.current_password.message}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Mật khẩu mới *</label>
                <input type="password" className={`${styles.input} ${errPw.new_password ? styles.inputError : ''}`}
                  {...regPass('new_password', { required: 'Bắt buộc', minLength: { value: 8, message: 'Ít nhất 8 ký tự' } })} />
                {errPw.new_password && <p className={styles.error}>{errPw.new_password.message}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Xác nhận mật khẩu mới *</label>
                <input type="password" className={`${styles.input} ${errPw.confirm ? styles.inputError : ''}`}
                  {...regPass('confirm', { required: 'Bắt buộc', validate: v => v === newPassword || 'Không khớp' })} />
                {errPw.confirm && <p className={styles.error}>{errPw.confirm.message}</p>}
              </div>
              <button type="submit" className={styles.submitBtn} disabled={passwordMutation.isLoading}>
                {passwordMutation.isLoading ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
