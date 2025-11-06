# Hybrid Model Usage Guide

**Your True Hybrid System is Ready!** 🎉

---

## ✅ What's Been Implemented

### Backend (Django) ✅
- **7 Roles:** superadmin, admin, manager, analyst, user, viewer, volunteer
- **22 Permissions:** Granular permissions across 5 categories
- **Role-Permission Mappings:** 51 automatic mappings
- **Audit Logging:** Track all user actions
- **Organization Support:** Multi-tenant foundation
- **API Integration:** Permissions returned in profile endpoint

### Frontend (React) ✅
- **Permission Hooks:** 8 custom hooks for permission checking
- **Auto-loading:** Permissions loaded on login
- **Cache System:** Fast permission lookups
- **Example Components:** Complete usage examples

---

## 🚀 Quick Start: Using Permissions

### 1. Basic Permission Check

```typescript
import { usePermission } from '../hooks/usePermission';

function UserManager() {
  const canManageUsers = usePermission('manage_users');

  if (!canManageUsers) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h2>User Management</h2>
      <UserList />
    </div>
  );
}
```

### 2. Conditional Button Rendering

```typescript
import { usePermission } from '../hooks/usePermission';

function TaskList() {
  const canDeleteTasks = usePermission('delete_tasks');
  const canExport = usePermission('export_data');

  return (
    <div>
      <TaskTable />

      {canDeleteTasks && (
        <Button color="error">Delete Selected</Button>
      )}

      {canExport && (
        <Button>Export to CSV</Button>
      )}
    </div>
  );
}
```

### 3. Role-Based Rendering

```typescript
import { useIsAdmin, useRole } from '../hooks/usePermission';

function Dashboard() {
  const isAdmin = useIsAdmin();
  const role = useRole();

  return (
    <div>
      <h1>Dashboard - {role}</h1>

      {isAdmin && <AdminStats />}

      <UserStats />
    </div>
  );
}
```

### 4. Multiple Permissions

```typescript
import { useAnyPermission, useAllPermissions } from '../hooks/usePermission';

function Reports() {
  // User needs ANY of these
  const canViewReports = useAnyPermission([
    'view_reports',
    'view_analytics',
    'view_basic_analytics'
  ]);

  // User needs ALL of these
  const canExportAdvanced = useAllPermissions([
    'export_data',
    'view_advanced_analytics'
  ]);

  return (
    <div>
      {canViewReports ? (
        <ReportList />
      ) : (
        <AccessDenied />
      )}

      {canExportAdvanced && (
        <Button>Export Advanced Report</Button>
      )}
    </div>
  );
}
```

### 5. Advanced Access Control

```typescript
import { useHasAccess } from '../hooks/usePermission';

function AdminPanel() {
  const hasAccess = useHasAccess({
    requiredRole: ['admin', 'superadmin'],
    requiredAnyPermission: ['manage_users', 'edit_settings']
  });

  if (!hasAccess) {
    return <Unauthorized />;
  }

  return <AdminContent />;
}
```

---

## 📖 Available Hooks

### `usePermissions()`
Returns all permission data:
```typescript
const { role, permissions, isLoading } = usePermissions();
// role: string
// permissions: string[]
// isLoading: boolean
```

### `usePermission(permission: string)`
Check single permission:
```typescript
const canEdit = usePermission('edit_users');
// Returns: boolean
```

### `useAnyPermission(permissions: string[])`
Check if user has ANY permission:
```typescript
const canViewData = useAnyPermission(['view_analytics', 'view_reports']);
// Returns: boolean
```

### `useAllPermissions(permissions: string[])`
Check if user has ALL permissions:
```typescript
const canManageAll = useAllPermissions(['manage_users', 'edit_settings']);
// Returns: boolean
```

### `useRole()`
Get current user role:
```typescript
const role = useRole();
// Returns: 'superadmin' | 'admin' | 'manager' | 'analyst' | 'user' | 'viewer' | 'volunteer'
```

### `useIsSuperAdmin()`
Check if superadmin:
```typescript
const isSuperAdmin = useIsSuperAdmin();
// Returns: boolean
```

### `useIsAdmin()`
Check if admin or superadmin:
```typescript
const isAdmin = useIsAdmin();
// Returns: boolean
```

### `useIsAdminOrManager()`
Check if admin, manager, or superadmin:
```typescript
const isAdminOrManager = useIsAdminOrManager();
// Returns: boolean
```

### `useHasAccess(options)`
Complex access check:
```typescript
const hasAccess = useHasAccess({
  requiredRole: ['admin', 'superadmin'],  // Optional
  requiredPermission: 'manage_users',     // Optional
  requiredAnyPermission: ['perm1', 'perm2'],  // Optional
  requiredAllPermissions: ['perm3', 'perm4']  // Optional
});
// Returns: boolean
```

---

## 🎯 Permission Reference

### User Management (5 permissions)
- `view_users` - View user list
- `create_users` - Create new users
- `edit_users` - Edit user details
- `delete_users` - Delete users
- `manage_roles` - Change user roles

### Data Access (7 permissions)
- `view_dashboard` - View dashboard
- `view_analytics` - View analytics
- `view_reports` - View reports
- `export_data` - Export data
- `import_data` - Import data
- `create_tasks` - Create tasks
- `manage_tasks` - Manage all tasks

### Analytics (3 permissions)
- `view_basic_analytics` - Basic analytics
- `view_advanced_analytics` - Advanced analytics
- `generate_reports` - Generate custom reports

### Settings (3 permissions)
- `view_settings` - View settings
- `edit_settings` - Edit settings
- `manage_billing` - Manage billing

### System (4 permissions)
- `manage_organizations` - Manage organizations
- `view_all_data` - View all data
- `manage_system_settings` - System settings
- `view_audit_logs` - View audit logs

---

## 🔧 Testing Your Implementation

### 1. Add Example Component to Routes

```typescript
// frontend/src/App.tsx
import PermissionExample from './components/PermissionExample';

// Add route:
<Route
  path="/permission-example"
  element={
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <Layout>
        <PermissionExample />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### 2. Test Login with Different Roles

```bash
# Admin (19 permissions)
Username: admin
Password: admin123
Navigate to: http://localhost:5173/permission-example

# Superadmin (ALL permissions)
Username: Superadmins
Password: admin123
Navigate to: http://localhost:5173/permission-example
```

### 3. Check Console Logs

After logging in, check browser console:
```
🔐 [1/6] Login: Attempting login for user: admin
✓ [2/6] Login: Authentication successful
💾 [3/6] Login: Access token stored
📡 [4/6] Login: Fetching user profile and permissions...
👤 [4/6] Login: User profile retrieved: {..., permissions: 19}
💾 [5/6] Login: User data stored
🔑 [6/6] Login: Loading permissions into cache...
✓ [6/6] Login: Permissions loaded successfully
```

### 4. View Permissions in Component

```typescript
function DebugPermissions() {
  const { role, permissions } = usePermissions();

  console.log('Current role:', role);
  console.log('Total permissions:', permissions.length);
  console.log('Permissions:', permissions);

  return (
    <div>
      <h3>Debug Info</h3>
      <p>Role: {role}</p>
      <p>Permissions: {permissions.join(', ')}</p>
    </div>
  );
}
```

---

## 🔄 Real-World Examples

### Example 1: Conditional Navigation Menu

```typescript
import { usePermission, useIsAdmin } from '../hooks/usePermission';

function Navigation() {
  const canViewAnalytics = usePermission('view_analytics');
  const canManageUsers = usePermission('manage_users');
  const isAdmin = useIsAdmin();

  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>

      {canViewAnalytics && (
        <Link to="/analytics">Analytics</Link>
      )}

      {canManageUsers && (
        <Link to="/users">User Management</Link>
      )}

      {isAdmin && (
        <Link to="/admin">Admin Panel</Link>
      )}
    </nav>
  );
}
```

### Example 2: Data Table with Actions

```typescript
import { usePermission } from '../hooks/usePermission';
import { DataGrid } from '@mui/x-data-grid';

function UserTable() {
  const canEditUsers = usePermission('edit_users');
  const canDeleteUsers = usePermission('delete_users');

  const columns = [
    { field: 'name', headerName: 'Name' },
    { field: 'email', headerName: 'Email' },
    {
      field: 'actions',
      headerName: 'Actions',
      renderCell: (params) => (
        <>
          {canEditUsers && (
            <Button onClick={() => editUser(params.row.id)}>
              Edit
            </Button>
          )}
          {canDeleteUsers && (
            <Button color="error" onClick={() => deleteUser(params.row.id)}>
              Delete
            </Button>
          )}
        </>
      ),
    },
  ];

  return <DataGrid columns={columns} rows={users} />;
}
```

### Example 3: Settings Page

```typescript
import { usePermission } from '../hooks/usePermission';

function Settings() {
  const canEditSettings = usePermission('edit_settings');
  const canManageBilling = usePermission('manage_billing');

  return (
    <div>
      <h1>Settings</h1>

      <Section title="General Settings">
        {canEditSettings ? (
          <SettingsForm />
        ) : (
          <SettingsView readonly />
        )}
      </Section>

      {canManageBilling && (
        <Section title="Billing">
          <BillingManagement />
        </Section>
      )}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Permissions Not Loading

**Problem:** Permissions array is empty after login

**Solution:**
1. Check backend is running: `http://localhost:8000`
2. Check profile endpoint: `curl http://localhost:8000/api/profile/me/ -H "Authorization: Bearer <token>"`
3. Verify permissions are seeded: `python manage.py seed_permissions`
4. Check browser console for errors

### Permission Always Returns False

**Problem:** `usePermission('my_permission')` always returns false

**Solution:**
1. Check permission name spelling
2. Verify permission exists in database
3. Check user's role has that permission
4. Try logging: `console.log(usePermissions())`

### Hooks Not Working in Component

**Problem:** Hook returns undefined or old data

**Solution:**
1. Ensure component is inside Router
2. Check user is logged in
3. Reload page after login
4. Clear localStorage and re-login

---

## 🎓 Next Steps

### 1. Customize Permissions
Add your own permissions:
```python
# backend/api/management/commands/seed_permissions.py
permissions_data = [
    # Add your custom permission
    {'name': 'approve_documents', 'category': 'data', 'description': 'Approve documents'},
]
```

Then run: `python manage.py seed_permissions`

### 2. Add to More Components
Update existing components to use permissions:
- Dashboard
- User management pages
- Settings pages
- Data export buttons

### 3. Implement Real-time Features (Next Phase)
- Real-time notifications via Supabase
- Live data updates
- Chat functionality

### 4. Add File Upload (Next Phase)
- Avatar uploads to Supabase Storage
- Document management
- Image galleries

---

## 📊 Role Capabilities Summary

| Feature | superadmin | admin | manager | analyst | user | viewer | volunteer |
|---------|------------|-------|---------|---------|------|--------|-----------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Billing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

⚠️ = Limited access (create/edit but not delete)

---

## ✨ Summary

**What You Have Now:**
- ✅ 7 Roles with hierarchical permissions
- ✅ 22 Granular permissions
- ✅ 8 React hooks for permission checking
- ✅ Auto-loading permissions on login
- ✅ Fast cached permission lookups
- ✅ Complete example components
- ✅ Django Admin integration

**What's Next:**
- 🔜 Supabase real-time notifications
- 🔜 File upload with Supabase Storage
- 🔜 Audit logging middleware

**Your hybrid model is working!** 🎉

Test it now at: http://localhost:5173/login
