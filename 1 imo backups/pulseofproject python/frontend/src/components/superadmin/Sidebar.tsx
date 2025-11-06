import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Avatar,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Domain as DomainIcon,
  Web as WebIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { authAPI } from '../../services/api';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/superadmin/dashboard',
    },
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/superadmin/users',
    },
    {
      text: 'Admin Management',
      icon: <AdminIcon />,
      path: '/superadmin/admins',
    },
    {
      text: 'Subdomains',
      icon: <DomainIcon />,
      path: '/superadmin/subdomains',
    },
    {
      text: 'Landing Pages',
      icon: <WebIcon />,
      path: '/superadmin/landing-pages',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/superadmin/settings',
    },
  ];

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const username = localStorage.getItem('username') || 'Admin';
  const role = localStorage.getItem('user_role') || 'superadmin';

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Logo/Brand Section */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Django + React
        </Typography>
        <Chip
          label={role.toUpperCase()}
          size="small"
          sx={{
            mt: 1,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 'bold',
          }}
        />
      </Box>

      {/* Menu Items - Scrollable Middle Section */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2 }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{ color: isActive ? 'white' : 'inherit', minWidth: 40 }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 'bold' : 'normal',
                      fontSize: '0.95rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Profile Section - Fixed at Bottom */}
      <Box>
        <Divider />
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'grey.50',
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 40,
              height: 40,
              mr: 2,
            }}
          >
            {getInitials(username)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              {username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {role}
            </Typography>
          </Box>
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{ color: 'error.main' }}
            title="Logout"
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
