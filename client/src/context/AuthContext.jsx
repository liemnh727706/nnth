import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const AuthContext = createContext(null);

// Tự động đăng xuất sau 15 phút không thao tác
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }

    // Phiên cũ quá 15 phút không hoạt động (đóng trình duyệt rồi mở lại) → buộc đăng nhập lại
    const last = parseInt(localStorage.getItem('lastActivity') || '0');
    if (last && Date.now() - last > IDLE_TIMEOUT_MS) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('lastActivity');
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = (tokens, userData) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await api.post('/auth/logout', { refreshToken }); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  // ── Idle timeout: tự logout sau 15 phút không sử dụng ──
  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return; // chỉ theo dõi khi đã đăng nhập

    const doIdleLogout = () => {
      logout();
      toast.info('Bạn đã được đăng xuất tự động sau 15 phút không hoạt động.', { autoClose: 8000 });
      window.location.href = '/login';
    };

    const resetTimer = () => {
      // Throttle: chỉ reset tối đa 1 lần/giây (tránh mousemove gọi liên tục)
      const now = Date.now();
      if (now - lastActivityRef.current < 1000) return;
      lastActivityRef.current = now;
      localStorage.setItem('lastActivity', String(now));
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(doIdleLogout, IDLE_TIMEOUT_MS);
    };

    // Kiểm tra khi quay lại tab (máy sleep, chuyển tab lâu...)
    const checkOnVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const last = parseInt(localStorage.getItem('lastActivity') || '0');
      if (last && Date.now() - last > IDLE_TIMEOUT_MS) doIdleLogout();
    };

    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', String(Date.now()));
    idleTimerRef.current = setTimeout(doIdleLogout, IDLE_TIMEOUT_MS);

    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    document.addEventListener('visibilitychange', checkOnVisible);

    return () => {
      clearTimeout(idleTimerRef.current);
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer));
      document.removeEventListener('visibilitychange', checkOnVisible);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
