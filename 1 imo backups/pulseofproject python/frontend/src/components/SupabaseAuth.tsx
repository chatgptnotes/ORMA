import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Box, Typography, Divider } from '@mui/material';

interface SupabaseAuthProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

const SupabaseAuth = ({ redirectTo = '/superadmin/dashboard', onSuccess: _onSuccess }: SupabaseAuthProps) => {
  return (
    <Box>
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR CONTINUE WITH
        </Typography>
      </Divider>

      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#1976d2',
                brandAccent: '#1565c0',
              },
            },
          },
        }}
        providers={['google', 'github']}
        redirectTo={redirectTo}
        onlyThirdPartyProviders
      />
    </Box>
  );
};

export default SupabaseAuth;
