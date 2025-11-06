import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { authAPI } from '../services/api';
import SupabaseAuth from '../components/SupabaseAuth';
import { supabase } from '../lib/supabase';
import { loadUserPermissions } from '../hooks/usePermission';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('🔐 Supabase Auth: User signed in via OAuth', {
          provider: session.user.app_metadata.provider,
          email: session.user.email,
        });

        // TODO: Sync Supabase user with Django backend or navigate directly
        // For now, navigate to superadmin dashboard
        navigate('/superadmin/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 [1/5] Login: Attempting login for user:', formData.username);
      const loginResponse = await authAPI.login(formData.username, formData.password);
      console.log('✓ [2/5] Login: Authentication successful, tokens received:', {
        hasAccess: !!loginResponse.access,
        hasRefresh: !!loginResponse.refresh
      });

      // Verify token is stored
      const storedToken = localStorage.getItem('access_token');
      console.log('💾 [3/5] Login: Access token stored in localStorage:', !!storedToken);

      // Get user profile and load permissions
      console.log('📡 [4/6] Login: Fetching user profile and permissions...');
      const profile = await authAPI.getProfile();
      const userRole = profile.role;
      console.log('👤 [4/6] Login: User profile retrieved:', {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: userRole,
        permissions: profile.permissions?.length || 0
      });

      // Store role and username in localStorage
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('username', profile.username);
      console.log('💾 [5/6] Login: User data stored in localStorage:', {
        role: userRole,
        username: profile.username
      });

      // Load permissions into cache
      console.log('🔑 [6/6] Login: Loading permissions into cache...');
      await loadUserPermissions();
      console.log('✓ [6/6] Login: Permissions loaded successfully');

      // Redirect based on role
      let redirectPath = '/user/dashboard';
      if (userRole === 'superadmin') {
        redirectPath = '/superadmin/dashboard';
      } else if (userRole === 'admin') {
        redirectPath = '/admin/dashboard';
      }

      console.log('🔀 [5/5] Login: Redirecting to:', redirectPath);
      navigate(redirectPath);
      console.log('✅ Login: Navigation triggered successfully');
    } catch (err: any) {
      console.error('❌ Login: Authentication failed at step:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Login
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption" display="block">
              <strong>Superadmin:</strong> Username: Superadmins, Password: admin123
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Admin:</strong> Username: admin, Password: admin123
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Typography align="center">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register">
                Register here
              </Link>
            </Typography>
          </form>

          <SupabaseAuth redirectTo={`${window.location.origin}/auth/callback`} />
        </CardContent>
      </Card>

      <Typography
        variant="caption"
        sx={{
          mt: 4,
          color: 'text.secondary',
          textAlign: 'center'
        }}
      >
        v1.5 - 2025-11-06
      </Typography>
    </Box>
  );
};

export default Login;
