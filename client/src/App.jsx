import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/common/Layout';
import AdminLayout from './components/admin/AdminLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import useSiteTheme from './config/useSiteTheme';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyEnrollments = lazy(() => import('./pages/MyEnrollments'));
const ExamResults = lazy(() => import('./pages/ExamResults'));
const Announcements = lazy(() => import('./pages/Announcements'));
const Profile = lazy(() => import('./pages/Profile'));
const PaymentResult = lazy(() => import('./pages/PaymentResult'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const AdminEnrollments = lazy(() => import('./pages/admin/Enrollments'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminExamResults = lazy(() => import('./pages/admin/ExamResults'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/payment/result" element={<PaymentResult />} />
        </Route>

        {/* Student routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/my-enrollments" element={<PrivateRoute><MyEnrollments /></PrivateRoute>} />
          <Route path="/exam-results" element={<PrivateRoute><ExamResults /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={
          <PrivateRoute roles={['super_admin', 'staff']}>
            <AdminLayout />
          </PrivateRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="enrollments" element={<AdminEnrollments />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="exam-results" element={<AdminExamResults />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="users" element={<PrivateRoute roles={['super_admin']}><AdminUsers /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function ThemeProvider({ children }) {
  useSiteTheme();
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </AuthProvider>
  );
}
