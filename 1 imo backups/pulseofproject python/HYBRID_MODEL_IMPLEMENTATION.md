# Hybrid Model Implementation Guide

**Target Architecture:** Django-Primary + Supabase-Supplementary Hybrid

---

## 🎯 Implementation Roadmap

### Phase 1: Enhanced RBAC (Week 1-2)
**Keep Django, Enhance Permissions**

#### 1.1 Enhanced User Model
```python
# backend/api/models.py

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('analyst', 'Analyst'),
        ('user', 'User'),
        ('viewer', 'Viewer'),
        ('volunteer', 'Volunteer'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    # Add permissions field
    custom_permissions = models.JSONField(default=list, blank=True)

    # Organization support (for future multi-tenancy)
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE, null=True, blank=True)

    # ... rest of fields
```

#### 1.2 Permission System
```python
# backend/api/models.py

class Permission(models.Model):
    """Granular permissions"""
    CATEGORIES = [
        ('users', 'User Management'),
        ('data', 'Data Access'),
        ('analytics', 'Analytics'),
        ('settings', 'Settings'),
        ('system', 'System'),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORIES)
    description = models.TextField()

    class Meta:
        ordering = ['category', 'name']

class RolePermission(models.Model):
    """Maps roles to permissions"""
    role = models.CharField(max_length=20)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['role', 'permission']

class UserPermission(models.Model):
    """User-specific permission overrides"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    granted = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'permission']
```

#### 1.3 Permission Middleware
```python
# backend/api/permissions/rbac.py

from rest_framework.permissions import BasePermission
from api.models import Permission, RolePermission, UserPermission

class HasPermission(BasePermission):
    """
    Check if user has specific permission
    Usage: permission_required = 'manage_users'
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Get required permission from view
        required_perm = getattr(view, 'permission_required', None)
        if not required_perm:
            return True

        # Check user permission
        return self.user_has_permission(request.user, required_perm)

    @staticmethod
    def user_has_permission(user, permission_name):
        """Check if user has permission"""
        profile = user.profile

        # Superadmin has all permissions
        if profile.role == 'superadmin':
            return True

        # Check role-based permissions
        role_perms = RolePermission.objects.filter(
            role=profile.role,
            permission__name=permission_name
        ).exists()

        if role_perms:
            return True

        # Check user-specific permissions
        user_perm = UserPermission.objects.filter(
            user=user,
            permission__name=permission_name,
            granted=True
        ).exists()

        return user_perm

# Usage in views:
class UserManagementView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'manage_users'

    def get(self, request):
        # Only users with 'manage_users' permission can access
        pass
```

#### 1.4 Frontend Permission Hooks
```typescript
// frontend/src/hooks/usePermission.ts

import { useState, useEffect } from 'react';
import axios from 'axios';

interface PermissionContext {
  role: string;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export function usePermissions(): PermissionContext {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>('user');

  useEffect(() => {
    // Fetch user permissions from Django
    const fetchPermissions = async () => {
      try {
        const response = await axios.get('/api/auth/permissions/');
        setPermissions(response.data.permissions);
        setRole(response.data.role);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (role === 'superadmin') return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(p => hasPermission(p));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every(p => hasPermission(p));
  };

  return {
    role,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: ['admin', 'superadmin'].includes(role),
    isSuperAdmin: role === 'superadmin',
  };
}

export function usePermission(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

// Usage in components:
function UserManager() {
  const canManageUsers = usePermission('manage_users');
  const canDeleteUsers = usePermission('delete_users');

  if (!canManageUsers) {
    return <AccessDenied />;
  }

  return (
    <div>
      <UserList />
      {canDeleteUsers && <DeleteButton />}
    </div>
  );
}
```

---

### Phase 2: Supabase Integration (Week 3-4)
**Add Real-time & Storage Features**

#### 2.1 Supabase Setup
```bash
# Install Supabase
npm install @supabase/supabase-js

# Create Supabase project (if not exists)
# Get credentials from Supabase dashboard
```

#### 2.2 Supabase Client Configuration
```typescript
// frontend/src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use Django JWT for primary auth
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Sync Django token with Supabase
export async function syncAuthTokens(djangoToken: string) {
  try {
    // Set custom access token for Supabase
    // This allows Supabase to use Django's authentication
    await supabase.auth.setSession({
      access_token: djangoToken,
      refresh_token: '', // Use Django's refresh token
    });
  } catch (error) {
    console.error('Failed to sync auth tokens:', error);
  }
}
```

#### 2.3 Real-time Notifications
```typescript
// frontend/src/hooks/useRealtimeNotifications.ts

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
}

export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Fetch initial notifications from Django
    fetchNotifications();

    // Subscribe to real-time updates via Supabase
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    // Fetch from Django API
    const response = await fetch('/api/notifications/');
    const data = await response.json();
    setNotifications(data);
  };

  return { notifications };
}
```

#### 2.4 File Storage with Supabase
```typescript
// frontend/src/services/fileUpload.ts

import { supabase } from '../lib/supabaseClient';

export async function uploadFile(
  file: File,
  bucket: string = 'avatars',
  path?: string
): Promise<string | null> {
  try {
    const fileName = path || `${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Store URL in Django database
    await fetch('/api/profile/update_avatar/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: publicUrl })
    });

    return publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

// Usage in component:
function AvatarUploader() {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, 'avatars');
    if (url) {
      console.log('File uploaded:', url);
    }
  };

  return <input type="file" onChange={handleUpload} />;
}
```

---

### Phase 3: Audit Logging (Week 5)
**Track All User Actions**

#### 3.1 Audit Log Model
```python
# backend/api/models.py

class AuditLog(models.Model):
    """Track all user actions"""
    ACTION_TYPES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('permission_change', 'Permission Change'),
        ('role_change', 'Role Change'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    target_model = models.CharField(max_length=100, blank=True)
    target_id = models.CharField(max_length=100, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action']),
            models.Index(fields=['target_model', 'target_id']),
        ]

def log_action(user, action, target_model=None, target_id=None, changes=None, request=None):
    """Helper function to log actions"""
    ip = get_client_ip(request) if request else None
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''

    AuditLog.objects.create(
        user=user,
        action=action,
        target_model=target_model,
        target_id=str(target_id) if target_id else '',
        changes=changes or {},
        ip_address=ip,
        user_agent=user_agent
    )
```

#### 3.2 Audit Middleware
```python
# backend/api/middleware/audit.py

from api.models import AuditLog
import json

class AuditMiddleware:
    """Automatically log all API requests"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only log authenticated requests
        if request.user.is_authenticated:
            # Skip health checks and static files
            if not request.path.startswith(('/api/health/', '/static/', '/media/')):
                self.log_request(request, response)

        return response

    def log_request(self, request, response):
        # Determine action type
        action = self.get_action_type(request.method)

        # Extract target info from URL
        target_model, target_id = self.extract_target(request.path)

        # Get request body changes
        changes = self.get_changes(request, response)

        # Log it
        AuditLog.objects.create(
            user=request.user,
            action=action,
            target_model=target_model,
            target_id=target_id,
            changes=changes,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
        )

    @staticmethod
    def get_action_type(method):
        mapping = {
            'POST': 'create',
            'GET': 'read',
            'PATCH': 'update',
            'PUT': 'update',
            'DELETE': 'delete',
        }
        return mapping.get(method, 'unknown')
```

---

### Phase 4: Multi-Tenancy Foundation (Week 6-8)
**Prepare for Multi-Organization Support**

#### 4.1 Organization Model
```python
# backend/api/models.py

class Organization(models.Model):
    """Multi-tenant organization support"""
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)

    # Subscription
    subscription_status = models.CharField(max_length=20, default='active')
    subscription_tier = models.CharField(max_length=20, default='basic')
    max_users = models.IntegerField(default=10)

    # Settings
    settings = models.JSONField(default=dict, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

# Update UserProfile
class UserProfile(models.Model):
    # ... existing fields
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='members',
        null=True,
        blank=True
    )
```

#### 4.2 Organization Middleware
```python
# backend/api/middleware/tenant.py

class TenantMiddleware:
    """Detect and set current organization"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Get user's organization
            try:
                request.organization = request.user.profile.organization
            except:
                request.organization = None

        return self.get_response(request)
```

---

## 🎯 Architecture Comparison

### Current (90% Django + 10% Supabase)
```
Django: 90%
├── API: 100%
├── Database: 100%
├── Auth: 90%
└── Storage: 100%

Supabase: 10%
└── OAuth: 100%
```

### After Hybrid (70% Django + 30% Supabase)
```
Django: 70%
├── API: 100%
├── Database: 100%
├── Auth: 80%
├── RBAC: 100%
├── Business Logic: 100%
└── Storage: 0%

Supabase: 30%
├── Real-time: 100%
├── File Storage: 100%
├── OAuth: 100%
└── Notifications: 100%
```

---

## 📊 Benefits of This Hybrid

### Keep (Django Strengths)
✅ Complex business logic in Python
✅ Django ORM for relational data
✅ Full control over API
✅ Existing authentication
✅ Django admin panel
✅ Strong typing with Python

### Add (Supabase Strengths)
✅ Real-time updates (WebSocket)
✅ Easy file storage (S3-compatible)
✅ OAuth providers out-of-the-box
✅ Instant push notifications
✅ Scalable storage
✅ Auto-generated APIs (optional)

---

## 🚀 Implementation Priority

### Week 1-2: RBAC (High Priority) ⭐⭐⭐
- Enhanced permission system
- 7 roles
- Permission middleware
- Frontend hooks

### Week 3-4: Real-time (Medium Priority) ⭐⭐
- Supabase real-time setup
- Live notifications
- WebSocket connections

### Week 5: Audit Logging (High Priority) ⭐⭐⭐
- Track all actions
- Compliance requirement
- Security monitoring

### Week 6-8: Multi-tenancy (Low Priority) ⭐
- Organization model
- Tenant isolation
- Subscription management

---

## 💰 Cost Comparison

### Current (Django Only)
- Server: $12-40/month
- Database: $15-30/month
- Storage: $5-20/month
- **Total: $32-90/month**

### Hybrid (Django + Supabase)
- Server: $12-40/month
- Database: $15-30/month
- Supabase Free tier: $0/month (500MB storage, 2GB bandwidth)
- **Total: $27-70/month** (potentially cheaper!)

### Supabase Pricing Tiers
- **Free**: $0 - 500MB storage, 2GB bandwidth
- **Pro**: $25/month - 8GB storage, 50GB bandwidth
- **Team**: $599/month - Unlimited everything

For your use case, Supabase Free tier is sufficient!

---

## 🎓 Learning Resources

### Django RBAC
- Django Guardian: https://django-guardian.readthedocs.io/
- Django Rules: https://github.com/dfunckt/django-rules

### Supabase
- Real-time: https://supabase.com/docs/guides/realtime
- Storage: https://supabase.com/docs/guides/storage
- Auth: https://supabase.com/docs/guides/auth

---

## ✅ Summary

**Your Current State:** Mostly Django with minimal Supabase

**Recommended Hybrid:** 70% Django + 30% Supabase

**Key Changes:**
1. Keep Django for core API and business logic ✅
2. Add enhanced RBAC system (7 roles, granular permissions)
3. Use Supabase for real-time features
4. Use Supabase for file storage
5. Add comprehensive audit logging
6. Prepare for multi-tenancy (optional)

**Result:** Best of both worlds - Django's power + Supabase's convenience

This approach maintains your current investment in Django while adding modern features that would be complex to build from scratch!
