import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Grid } from "@mui/material";
import { Link } from 'react-router-dom';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import { authAPI } from '../services/api';

const Home = () => {
  const isAuthenticated = authAPI.isAuthenticated();

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Pulseofpeople.com
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Modern platform for community engagement and people analytics
        </Typography>
        <Box sx={{ mt: 4 }}>
          {isAuthenticated ? (
            <Button
              component={Link}
              to="/dashboard"
              variant="contained"
              size="large"
              sx={{ mr: 2 }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                sx={{ mr: 2 }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="outlined"
                size="large"
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CodeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Modern Stack
              </Typography>
              <Typography color="text.secondary">
                Built with Django 5.2, React 18, TypeScript, and Material UI
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Secure Authentication
              </Typography>
              <Typography color="text.secondary">
                JWT-based authentication with automatic token refresh
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Fast Development
              </Typography>
              <Typography color="text.secondary">
                Vite for blazing fast development with hot module replacement
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
