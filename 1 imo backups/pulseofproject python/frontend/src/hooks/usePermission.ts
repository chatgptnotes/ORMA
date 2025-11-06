/**
 * Permission hooks for RBAC system
 * Provides easy-to-use hooks for checking user permissions in components
 */

import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface UserPermissions {
  role: string;
  permissions: string[];
  isLoading: boolean;
}

// Global permission state (singleton pattern)
let permissionsCache: UserPermissions | null = null;
let permissionsListeners: Array<(perms: UserPermissions | null) => void> = [];

/**
 * Subscribe to permission changes
 */
function subscribeToPermissions(callback: (perms: UserPermissions | null) => void) {
  permissionsListeners.push(callback);
  return () => {
    permissionsListeners = permissionsListeners.filter(cb => cb !== callback);
  };
}

/**
 * Notify all listeners of permission changes
 */
function notifyPermissionChange(perms: UserPermissions | null) {
  permissionsCache = perms;
  permissionsListeners.forEach(callback => callback(perms));
}

/**
 * Fetch and cache user permissions
 */
export async function loadUserPermissions(): Promise<UserPermissions | null> {
  try {
    const profile = await authAPI.getProfile();
    const permissions: UserPermissions = {
      role: profile.role,
      permissions: profile.permissions || [],
      isLoading: false,
    };
    notifyPermissionChange(permissions);
    return permissions;
  } catch (error) {
    console.error('Failed to load permissions:', error);
    notifyPermissionChange(null);
    return null;
  }
}

/**
 * Clear cached permissions (on logout)
 */
export function clearPermissions() {
  notifyPermissionChange(null);
}

/**
 * Hook to get all user permissions
 */
export function usePermissions(): UserPermissions {
  const [permissions, setPermissions] = useState<UserPermissions>(
    permissionsCache || {
      role: localStorage.getItem('user_role') || 'user',
      permissions: [],
      isLoading: true,
    }
  );

  useEffect(() => {
    // Load permissions if not cached
    if (!permissionsCache && authAPI.isAuthenticated()) {
      loadUserPermissions();
    }

    // Subscribe to permission changes
    const unsubscribe = subscribeToPermissions((perms) => {
      if (perms) {
        setPermissions(perms);
      } else {
        setPermissions({
          role: 'user',
          permissions: [],
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  }, []);

  return permissions;
}

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const { role, permissions } = usePermissions();

  // Superadmin has all permissions
  if (role === 'superadmin') {
    return true;
  }

  // Check if permission exists in user's permissions
  return permissions.includes(permission);
}

/**
 * Hook to check if user has ANY of the specified permissions
 */
export function useAnyPermission(permissionsList: string[]): boolean {
  const { role, permissions } = usePermissions();

  // Superadmin has all permissions
  if (role === 'superadmin') {
    return true;
  }

  // Check if user has at least one permission
  return permissionsList.some(perm => permissions.includes(perm));
}

/**
 * Hook to check if user has ALL of the specified permissions
 */
export function useAllPermissions(permissionsList: string[]): boolean {
  const { role, permissions } = usePermissions();

  // Superadmin has all permissions
  if (role === 'superadmin') {
    return true;
  }

  // Check if user has all permissions
  return permissionsList.every(perm => permissions.includes(perm));
}

/**
 * Hook to get current user role
 */
export function useRole(): string {
  const { role } = usePermissions();
  return role;
}

/**
 * Hook to check if user is superadmin
 */
export function useIsSuperAdmin(): boolean {
  const role = useRole();
  return role === 'superadmin';
}

/**
 * Hook to check if user is admin or superadmin
 */
export function useIsAdmin(): boolean {
  const role = useRole();
  return role === 'admin' || role === 'superadmin';
}

/**
 * Hook to check if user is admin, manager, or superadmin
 */
export function useIsAdminOrManager(): boolean {
  const role = useRole();
  return ['admin', 'manager', 'superadmin'].includes(role);
}

/**
 * Hook to check multiple conditions
 */
export function useHasAccess(options: {
  requiredRole?: string[];
  requiredPermission?: string;
  requiredAnyPermission?: string[];
  requiredAllPermissions?: string[];
}): boolean {
  const { role, permissions } = usePermissions();

  // Superadmin always has access
  if (role === 'superadmin') {
    return true;
  }

  // Check role requirement
  if (options.requiredRole && !options.requiredRole.includes(role)) {
    return false;
  }

  // Check single permission
  if (options.requiredPermission && !permissions.includes(options.requiredPermission)) {
    return false;
  }

  // Check any permission
  if (options.requiredAnyPermission && !options.requiredAnyPermission.some(p => permissions.includes(p))) {
    return false;
  }

  // Check all permissions
  if (options.requiredAllPermissions && !options.requiredAllPermissions.every(p => permissions.includes(p))) {
    return false;
  }

  return true;
}
