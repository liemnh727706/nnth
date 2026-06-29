import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../utils/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken) { navigate('/login?error=auth_failed'); return; }

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken || '');

    api.get('/auth/me')
      .then(({ data }) => {
        login({ accessToken, refreshToken }, data);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => navigate('/login?error=auth_failed'));
  }, []);

  return <LoadingSpinner fullScreen />;
}
