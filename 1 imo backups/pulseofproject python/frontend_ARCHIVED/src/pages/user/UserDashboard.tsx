import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  TextField,
} from '@mui/material';
import { Grid } from "@mui/material";
import {
  Person as PersonIcon,
  Task as TaskIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { authAPI } from '../../services/api';
import api from '../../services/api';

interface Profile {
  id: number;
  username: string;
  email: string;
  role: string;
  bio?: string;
  phone?: string;
  date_of_birth?: string;
}

interface DashboardStats {
  username: string;
  email: string;
  role: string;
  tasks: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  account: {
    date_joined: string;
    last_login: string;
    is_active: boolean;
  };
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    phone: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profile
      const profileResponse = await api.get('/user/profile/me/');
      setProfile(profileResponse.data);
      setFormData({
        bio: profileResponse.data.bio || '',
        phone: profileResponse.data.phone || '',
      });

      // Fetch dashboard stats
      const statsResponse = await api.get('/user/profile/dashboard_stats/');
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleUpdateProfile = async () => {
    try {
      await api.put('/user/profile/update_me/', formData);
      setEditMode(false);
      fetchData();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TaskIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Tasks</Typography>
                </Box>
                <Typography variant="h3">{stats.tasks.total}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PendingIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Pending</Typography>
                </Box>
                <Typography variant="h3">{stats.tasks.pending}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TaskIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">In Progress</Typography>
                </Box>
                <Typography variant="h3">{stats.tasks.in_progress}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Completed</Typography>
                </Box>
                <Typography variant="h3">{stats.tasks.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Profile Card */}
      {profile && (
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">My Profile</Typography>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
                    <PersonIcon sx={{ fontSize: 50 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{profile.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Role: {profile.role}
                    </Typography>
                  </Box>
                </Box>

                {editMode ? (
                  <Box>
                    <TextField
                      fullWidth
                      label="Bio"
                      multiline
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <Button variant="contained" onClick={handleUpdateProfile}>
                      Save Changes
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Bio:</strong> {profile.bio || 'Not set'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {profile.phone || 'Not set'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Account Information
                </Typography>
                {stats && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Joined:</strong>{' '}
                      {new Date(stats.account.date_joined).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Last Login:</strong>{' '}
                      {stats.account.last_login
                        ? new Date(stats.account.last_login).toLocaleString()
                        : 'Never'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong>{' '}
                      {stats.account.is_active ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          v1.0 - November 5, 2025
        </Typography>
      </Box>
    </Container>
  );
};

export default UserDashboard;
