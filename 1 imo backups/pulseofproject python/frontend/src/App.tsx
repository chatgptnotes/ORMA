import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FilesPage from './pages/FilesPage';
import SuperAdminDashboardNew from './pages/superadmin/SuperAdminDashboardNew';
import Subdomains from './pages/superadmin/Subdomains';
import LandingPages from './pages/superadmin/LandingPages';
import Users from './pages/superadmin/Users';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import AuthCallback from './pages/auth/AuthCallback';
import { authAPI } from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactElement; allowedRoles?: string[] }) => {
  const isAuthenticated = authAPI.isAuthenticated();
  const userRole = authAPI.getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Files Route - Requires authentication */}
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Layout><FilesPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* SuperAdmin Routes - All require authentication */}
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboardNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/users"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/subdomains"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Subdomains />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/landing-pages"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <LandingPages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/*"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboardNew />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - All require authentication */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* User Routes - All require authentication */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/*"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
