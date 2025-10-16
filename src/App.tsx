import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Use DevAuthContext for development (auto-login, no real authentication)
import { AuthProvider } from './contexts/DevAuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './pages/ApplicationForm';
import Applications from './pages/Applications';
import ApplicationDetailSplit from './pages/ApplicationDetailSplit';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Application Form - Public for development */}
          <Route path="/apply" element={<ApplicationForm />} />

          {/* Admin-Only Routes */}
          <Route path="/dashboard" element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          } />

          <Route path="/applications" element={
            <AdminRoute>
              <Applications />
            </AdminRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Application Detail Route - Admin Only */}
          <Route path="/application/:id" element={
            <AdminRoute>
              <ApplicationDetailSplit />
            </AdminRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;