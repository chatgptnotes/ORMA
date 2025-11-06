/**
 * Example Component: Using Permission Hooks
 *
 * This file demonstrates all the ways to use permission hooks
 * in your React components for RBAC (Role-Based Access Control)
 */

import { Box, Button, Card, CardContent, Typography, Chip } from '@mui/material';
import {
  usePermissions,
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useRole,
  useIsSuperAdmin,
  useIsAdmin,
  useIsAdminOrManager,
  useHasAccess
} from '../hooks/usePermission';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

/**
 * Example 1: Basic Permission Check
 */
function BasicPermissionExample() {
  const canManageUsers = usePermission('manage_users');
  const canExportData = usePermission('export_data');

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Example 1: Basic Permission Check
        </Typography>

        {canManageUsers ? (
          <Button variant="contained" color="primary" startIcon={<CheckCircleIcon />}>
            Manage Users (You have permission)
          </Button>
        ) : (
          <Button variant="outlined" disabled startIcon={<LockIcon />}>
            Manage Users (No permission)
          </Button>
        )}

        <Box sx={{ mt: 1 }}>
          {canExportData ? (
            <Button variant="contained" color="secondary" startIcon={<CheckCircleIcon />}>
              Export Data (You have permission)
            </Button>
          ) : (
            <Button variant="outlined" disabled startIcon={<LockIcon />}>
              Export Data (No permission)
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: Multiple Permissions Check
 */
function MultiplePermissionsExample() {
  // User needs ANY of these permissions
  const canAccessAnalytics = useAnyPermission([
    'view_analytics',
    'view_advanced_analytics',
    'view_basic_analytics'
  ]);

  // User needs ALL of these permissions
  const canManageEverything = useAllPermissions([
    'manage_users',
    'edit_settings',
    'view_audit_logs'
  ]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Example 2: Multiple Permissions
        </Typography>

        <Box>
          <Typography variant="body2">
            Can access analytics (needs ANY permission):
            {canAccessAnalytics ? (
              <Chip label="Yes" color="success" size="small" sx={{ ml: 1 }} />
            ) : (
              <Chip label="No" color="error" size="small" sx={{ ml: 1 }} />
            )}
          </Typography>

          <Typography variant="body2" sx={{ mt: 1 }}>
            Can manage everything (needs ALL permissions):
            {canManageEverything ? (
              <Chip label="Yes" color="success" size="small" sx={{ ml: 1 }} />
            ) : (
              <Chip label="No" color="error" size="small" sx={{ ml: 1 }} />
            )}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: Role-Based Rendering
 */
function RoleBasedExample() {
  const role = useRole();
  const isSuperAdmin = useIsSuperAdmin();
  const isAdmin = useIsAdmin();
  const isAdminOrManager = useIsAdminOrManager();

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Example 3: Role-Based Rendering
        </Typography>

        <Box>
          <Typography variant="body2">Your role: <Chip label={role} color="primary" size="small" /></Typography>

          {isSuperAdmin && (
            <Typography variant="body1" color="error" sx={{ mt: 1 }}>
              🔐 You are a SUPERADMIN - You can do anything!
            </Typography>
          )}

          {isAdmin && !isSuperAdmin && (
            <Typography variant="body1" color="warning.main" sx={{ mt: 1 }}>
              👔 You are an ADMIN - You have elevated permissions
            </Typography>
          )}

          {isAdminOrManager && !isAdmin && (
            <Typography variant="body1" color="info.main" sx={{ mt: 1 }}>
              📊 You are a MANAGER - You can manage teams
            </Typography>
          )}

          {!isAdminOrManager && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              👤 You are a regular user
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Advanced Access Control
 */
function AdvancedAccessExample() {
  // Complex access check
  const canAccessAdminPanel = useHasAccess({
    requiredRole: ['admin', 'superadmin'],
    requiredAnyPermission: ['manage_users', 'edit_settings']
  });

  const canExportReports = useHasAccess({
    requiredPermission: 'export_data',
    requiredAnyPermission: ['view_reports', 'view_analytics']
  });

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Example 4: Advanced Access Control
        </Typography>

        <Box>
          <Typography variant="body2">
            Admin Panel Access (needs admin role + specific permissions):
            {canAccessAdminPanel ? (
              <CheckCircleIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
            ) : (
              <CancelIcon color="error" sx={{ ml: 1, verticalAlign: 'middle' }} />
            )}
          </Typography>

          <Typography variant="body2" sx={{ mt: 1 }}>
            Export Reports (needs export permission + view permission):
            {canExportReports ? (
              <CheckCircleIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
            ) : (
              <CancelIcon color="error" sx={{ ml: 1, verticalAlign: 'middle' }} />
            )}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Example 5: All Permissions Display
 */
function AllPermissionsDisplay() {
  const { role, permissions, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading permissions...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Example 5: All Your Permissions
        </Typography>

        <Typography variant="body2" gutterBottom>
          Role: <Chip label={role} color="primary" size="small" />
        </Typography>

        <Typography variant="body2" gutterBottom>
          Total Permissions: {permissions.length}
        </Typography>

        <Box sx={{ mt: 2 }}>
          {permissions.map((perm) => (
            <Chip
              key={perm}
              label={perm}
              size="small"
              sx={{ m: 0.5 }}
              color="success"
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Main Component: Combines all examples
 */
export default function PermissionExample() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Permission Hooks Examples
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        This page demonstrates how to use permission hooks in your components.
        Different content will be shown based on your role and permissions.
      </Typography>

      <BasicPermissionExample />
      <MultiplePermissionsExample />
      <RoleBasedExample />
      <AdvancedAccessExample />
      <AllPermissionsDisplay />

      <Typography
        variant="caption"
        sx={{
          mt: 4,
          display: 'block',
          color: 'text.secondary',
          textAlign: 'center'
        }}
      >
        v1.6 - 2025-11-06
      </Typography>
    </Box>
  );
}

/**
 * Usage in Your Components:
 *
 * 1. Single Permission Check:
 * ```tsx
 * const canEdit = usePermission('edit_users');
 * if (!canEdit) return <AccessDenied />;
 * ```
 *
 * 2. Multiple Permissions:
 * ```tsx
 * const hasAnalyticsAccess = useAnyPermission(['view_analytics', 'view_reports']);
 * ```
 *
 * 3. Role Check:
 * ```tsx
 * const isAdmin = useIsAdmin();
 * return isAdmin ? <AdminPanel /> : <UserDashboard />;
 * ```
 *
 * 4. Conditional Rendering:
 * ```tsx
 * <Button disabled={!usePermission('delete_users')}>
 *   Delete User
 * </Button>
 * ```
 */
