import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Stack,
} from '@mui/material';
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { authAPI } from '../../services/api';
import api from '../../services/api';

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  first_name?: string;
  last_name?: string;
}

interface Stats {
  total_users: number;
  superadmins: number;
  admins: number;
  users: number;
  active_users: number;
  inactive_users: number;
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    superadmins: 0,
    admins: 0,
    users: 0,
    active_users: 0,
    inactive_users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch users
      const usersResponse = await api.get('/superadmin/users/');
      console.log('Users:', usersResponse.data);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);

      // Fetch statistics
      const statsResponse = await api.get('/superadmin/users/statistics/');
      console.log('Stats:', statsResponse.data);
      setStats(statsResponse.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await api.patch(`/superadmin/users/${selectedUser.id}/change_role/`, {
        role: newRole,
      });
      setOpenDialog(false);
      fetchData();
    } catch (error: any) {
      console.error('Error changing role:', error);
      alert(error.response?.data?.error || 'Failed to change role');
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await api.post(`/superadmin/users/${userId}/toggle_active/`);
      fetchData();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      alert(error.response?.data?.error || 'Failed to toggle user status');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'error';
      case 'admin':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
            SuperAdmin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage all users, roles, and system settings
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Total Users</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">{stats.total_users}</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                All registered users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                  <AdminIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Superadmins</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">{stats.superadmins || 0}</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Full system access
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            color: '#333',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.1)', mr: 2 }}>
                  <AdminIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Admins</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">{stats.admins || 0}</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                User management
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: '#333',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.1)', mr: 2 }}>
                  <UserIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Regular Users</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">{stats.users || 0}</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Standard access
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">All Users</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage user roles and permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                }
              }}
            >
              Add User
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {users.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PeopleIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add users to see them listed here
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>User</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Joined</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: getRoleColor(user.role) + '.main' }}>
                            {getInitials(user.username)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {user.username}
                            </Typography>
                            {user.first_name && (
                              <Typography variant="caption" color="text.secondary">
                                {user.first_name} {user.last_name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role.toUpperCase()}
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.is_active ? <ActiveIcon /> : <InactiveIcon />}
                          label={user.is_active ? 'Active' : 'Inactive'}
                          color={user.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.date_joined).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setOpenDialog(true);
                          }}
                          title="Change Role"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color={user.is_active ? 'error' : 'success'}
                          onClick={() => handleToggleActive(user.id)}
                          title={user.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {user.is_active ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Change User Role
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 3 }}>
            User: <strong>{selectedUser?.username}</strong> ({selectedUser?.email})
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={newRole}
              label="Role"
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="user">User - Standard Access</MenuItem>
              <MenuItem value="admin">Admin - User Management</MenuItem>
              <MenuItem value="superadmin">Superadmin - Full Access</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRoleChange}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Change Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box sx={{ mt: 6, py: 3, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          v1.0 - November 5, 2025 | SuperAdmin Dashboard
        </Typography>
      </Box>
    </Container>
  );
};

export default SuperAdminDashboard;
