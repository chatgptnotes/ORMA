import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import { Grid } from "@mui/material";
import {
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
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

const SuperAdminDashboardNew = () => {
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
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const usersResponse = await api.get('/superadmin/users/');
      // API returns paginated response with 'results' array
      const usersData = usersResponse.data.results || usersResponse.data;
      setUsers(Array.isArray(usersData) ? usersData : []);

      const statsResponse = await api.get('/superadmin/users/statistics/');
      setStats(statsResponse.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await api.patch(`/superadmin/users/${selectedUser.id}/change_role/`, {
        role: newRole,
      });
      setOpenRoleDialog(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to change role');
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.username || !newUser.email || !newUser.password) {
        alert('Please fill all required fields');
        return;
      }

      await api.post('/superadmin/users/create_admin/', newUser);
      setOpenAddUserDialog(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'user',
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await api.post(`/superadmin/users/${userId}/toggle_active/`);
      fetchData();
    } catch (error: any) {
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
      <SuperAdminLayout
        pageTitle="Dashboard Overview"
        pageSubtitle="Manage all users, roles, and system settings"
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading Dashboard...
            </Typography>
          </Box>
        </Box>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      pageTitle="Dashboard Overview"
      pageSubtitle="Manage all users, roles, and system settings"
      onRefresh={fetchData}
    >
      <Box sx={{ width: '100%' }}>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">Total Users</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold">{stats.total_users}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', mr: 2 }}>
                    <AdminIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">Superadmins</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold">{stats.superadmins || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              color: '#333',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.1)', mr: 2 }}>
                    <AdminIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">Admins</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold">{stats.admins || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.1)', mr: 2 }}>
                    <UserIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">Regular Users</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold">{stats.users || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Users Table */}
        <Card>
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
                onClick={() => setOpenAddUserDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  Click "Add User" to create your first user
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
                      <TableRow key={user.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
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
                          {new Date(user.date_joined).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setOpenRoleDialog(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={user.is_active ? 'error' : 'success'}
                            onClick={() => handleToggleActive(user.id)}
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

        {/* Add User Dialog */}
        <Dialog open={openAddUserDialog} onClose={() => setOpenAddUserDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Add New User
          </DialogTitle>
          <DialogContent sx={{ pt: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="First Name"
                value={newUser.first_name}
                onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Last Name"
                value={newUser.last_name}
                onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                variant="outlined"
              />
              <FormControl fullWidth variant="outlined">
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <MenuItem value="user">User - Standard Access</MenuItem>
                  <MenuItem value="admin">Admin - User Management</MenuItem>
                  <MenuItem value="superadmin">Superadmin - Full Access</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Button onClick={() => setOpenAddUserDialog(false)} color="inherit">Cancel</Button>
            <Button
              onClick={handleAddUser}
              variant="contained"
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Create User
            </Button>
          </DialogActions>
        </Dialog>

        {/* Role Change Dialog */}
        <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Change User Role
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" sx={{ mb: 3 }}>
              User: <strong>{selectedUser?.username}</strong> ({selectedUser?.email})
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={newRole} label="Role" onChange={(e) => setNewRole(e.target.value)}>
                <MenuItem value="user">User - Standard Access</MenuItem>
                <MenuItem value="admin">Admin - User Management</MenuItem>
                <MenuItem value="superadmin">Superadmin - Full Access</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRoleChange}
              variant="contained"
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Change Role
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboardNew;
