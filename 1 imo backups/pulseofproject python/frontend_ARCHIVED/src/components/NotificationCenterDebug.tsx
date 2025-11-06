/**
 * DEBUG: Simple Notification Center to test Menu functionality
 */

import { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

export default function NotificationCenterDebug() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log('🔔 Bell clicked!', event.currentTarget);
    setAnchorEl(event.currentTarget);
    console.log('🔔 anchorEl set:', event.currentTarget);
  };

  const handleClose = () => {
    console.log('🔔 Menu closing');
    setAnchorEl(null);
  };

  console.log('🔔 NotificationCenterDebug render:', { anchorEl, open });

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notifications"
      >
        <Badge badgeContent={3} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              zIndex: 9999,
            }
          }
        }}
      >
        <MenuItem onClick={handleClose}>
          <Typography>Test Notification 1</Typography>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Typography>Test Notification 2</Typography>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Typography>Test Notification 3</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
