/**
 * Notification Center Component
 * Displays notifications with real-time updates
 */

import { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Button,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import TaskIcon from '@mui/icons-material/Task';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../services/notificationService';

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircleIcon color="success" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'error':
      return <ErrorIcon color="error" />;
    case 'task':
      return <TaskIcon color="primary" />;
    case 'user':
      return <PersonIcon color="primary" />;
    case 'system':
      return <SettingsIcon color="action" />;
    default:
      return <InfoIcon color="info" />;
  }
}

/**
 * Get color for notification type
 */
function getNotificationColor(type: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'task':
      return 'primary';
    default:
      return 'info';
  }
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Single Notification Item
 */
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete, onClose }: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setIsDeleting(false);
    }
  };

  const handleClick = async () => {
    if (!notification.is_read) {
      await onMarkAsRead(notification.id);
    }
    onClose();
  };

  return (
    <ListItem
      secondaryAction={
        <IconButton
          edge="end"
          size="small"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" />}
        </IconButton>
      }
      disablePadding
    >
      <ListItemButton
        onClick={handleClick}
        sx={{
          bgcolor: notification.is_read ? 'transparent' : 'action.hover',
          '&:hover': {
            bgcolor: 'action.selected',
          },
        }}
      >
        <ListItemIcon>{getNotificationIcon(notification.notification_type)}</ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                {notification.title}
              </Typography>
              <Chip
                label={notification.notification_type}
                size="small"
                color={getNotificationColor(notification.notification_type)}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Box>
          }
          secondary={
            <>
              <Typography variant="body2" component="span" display="block">
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(notification.created_at)}
              </Typography>
            </>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}

/**
 * Notification Center Component
 */
export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get recent notifications (last 10)
  const recentNotifications = Array.isArray(notifications) ? notifications.slice(0, 10) : [];

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: 400,
              maxHeight: 600,
              zIndex: 9999,
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Divider />

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Box sx={{ p: 2 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
            <Button size="small" onClick={refreshNotifications} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!Array.isArray(notifications) || notifications.length === 0) && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        )}

        {/* Notification List */}
        {!isLoading && !error && Array.isArray(notifications) && notifications.length > 0 && (
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClose={handleClose}
              />
            ))}
          </List>
        )}

        {/* Footer */}
        {Array.isArray(notifications) && notifications.length > 10 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button size="small" fullWidth onClick={handleClose}>
                View All ({notifications.length})
              </Button>
            </Box>
          </>
        )}

        {/* Version Footer */}
        <Divider />
        <Typography
          variant="caption"
          sx={{
            p: 1,
            display: 'block',
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          v1.7 - 2025-11-06
        </Typography>
      </Menu>
    </>
  );
}
