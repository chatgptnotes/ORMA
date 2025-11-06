import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth Callback: Processing OAuth callback...');

        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Auth Callback: Session error:', sessionError);
          setError(sessionError.message);
          return;
        }

        if (!session) {
          console.error('❌ Auth Callback: No session found');
          setError('Authentication failed. No session found.');
          return;
        }

        console.log('✓ Auth Callback: Session retrieved successfully', {
          provider: session.user.app_metadata.provider,
          email: session.user.email,
        });

        // TODO: Sync Supabase user with Django backend
        // For now, store user info and navigate to dashboard
        localStorage.setItem('supabase_user', JSON.stringify(session.user));
        localStorage.setItem('user_role', 'user'); // Default role for OAuth users

        console.log('🔀 Auth Callback: Redirecting to dashboard...');
        navigate('/superadmin/dashboard');
      } catch (err: any) {
        console.error('❌ Auth Callback: Unexpected error:', err);
        setError(err.message || 'An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => navigate('/login')}
        >
          Return to login
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        Completing sign in...
      </Typography>
    </Box>
  );
};

export default AuthCallback;
