# Multi-Auth System Setup Guide

## Overview
This project now has a complete multi-role authentication system with **Superadmin**, **Admin**, and **User** roles using Django REST Framework and React.

## Architecture

### Role Hierarchy
```
Superadmin (Level 3)
    ├─ Can manage all users (including admins and superadmins)
    ├─ Can change user roles
    ├─ Can access system-wide statistics
    └─ Full system access

Admin (Level 2)
    ├─ Can manage regular users only
    ├─ Cannot change roles
    ├─ Cannot manage other admins or superadmins
    └─ Limited management access

User (Level 1)
    ├─ Can manage own profile
    ├─ Can view own tasks
    └─ Basic user access
```

## Backend Implementation

### 1. Database Structure

**UserProfile Model** (`backend/api/models.py:5-32`)
```python
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('admin', 'Admin'),
        ('user', 'User'),
    ]

    user = OneToOneField(User)
    role = CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    bio = TextField(blank=True)
    avatar = ImageField(upload_to='avatars/')
    phone = CharField(max_length=20)
    date_of_birth = DateField()

    # Helper methods
    def is_superadmin(self) -> bool
    def is_admin(self) -> bool
    def is_admin_or_above(self) -> bool
```

### 2. Middleware

**RoleAuthMiddleware** (`backend/api/middleware/role_auth_middleware.py`)
- Automatically attaches user role to every request
- Makes role available via: `request.user_role`, `request.is_superadmin`, `request.is_admin_or_above`
- Runs globally after authentication

**RequestLoggingMiddleware**
- Logs all API requests with user and role information
- Helps with debugging and auditing

### 3. Permissions

**Custom Permission Classes** (`backend/api/permissions/role_permissions.py`)

| Permission Class | Who Can Access |
|-----------------|----------------|
| `IsSuperAdmin` | Only superadmins |
| `IsAdminOrAbove` | Admins + Superadmins |
| `IsAdmin` | Only admins |
| `IsUser` | All authenticated users |
| `CanManageUsers` | Admins (users only) + Superadmins (all) |
| `CanChangeRole` | Only superadmins |
| `IsOwnerOrAdminOrAbove` | Owner or admin+ |

### 4. API Endpoints

#### Superadmin Endpoints (`/api/superadmin/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/` | List all users (all roles) |
| POST | `/users/` | Create user with any role |
| GET | `/users/{id}/` | Get user details |
| PUT | `/users/{id}/` | Update user |
| DELETE | `/users/{id}/` | Delete user |
| PATCH | `/users/{id}/change_role/` | Change user role |
| POST | `/users/{id}/toggle_active/` | Activate/deactivate user |
| GET | `/users/statistics/` | Get system statistics |
| GET | `/users/admins/` | List all admins |
| POST | `/users/create_admin/` | Create admin/superadmin |

#### Admin Endpoints (`/api/admin/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/` | List regular users only |
| POST | `/users/` | Create regular user |
| GET | `/users/{id}/` | Get user details |
| PUT | `/users/{id}/` | Update user (no role change) |
| DELETE | `/users/{id}/` | Delete regular user |
| POST | `/users/{id}/toggle_active/` | Activate/deactivate user |
| GET | `/users/statistics/` | Get user statistics |

#### User Endpoints (`/api/user/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/me/` | Get own profile |
| PUT | `/profile/update_me/` | Update own profile |
| POST | `/profile/change_password/` | Change own password |
| GET | `/profile/dashboard_stats/` | Get dashboard stats |

## Frontend Structure

### Folder Organization
```
frontend/src/
├── pages/
│   ├── superadmin/
│   │   ├── SuperAdminDashboard.tsx
│   │   ├── ManageAdmins.tsx
│   │   ├── ManageUsers.tsx
│   │   └── SystemSettings.tsx
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   └── ManageUsers.tsx
│   └── user/
│       ├── UserDashboard.tsx
│       └── Profile.tsx
├── components/
│   ├── superadmin/
│   ├── admin/
│   └── user/
├── services/
│   ├── api.ts
│   ├── superadminAPI.ts
│   ├── adminAPI.ts
│   └── userAPI.ts
└── types/
    └── index.ts  # Updated with UserRole type
```

### TypeScript Types
```typescript
export type UserRole = 'superadmin' | 'admin' | 'user';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: UserRole;  // NEW
  bio?: string;
  avatar?: string;
  phone?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface UserManagement {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}
```

## Setup Instructions

### Backend Setup

1. **Activate Virtual Environment**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies** (already done)
```bash
pip install -r requirements.txt
```

3. **Apply Migrations** (already done)
```bash
python manage.py migrate
```

4. **Create Superadmin User**
```bash
# Method 1: Using createsuperuser
python manage.py createsuperuser
# Enter username, email, password

# Method 2: Programmatically
python manage.py shell
>>> from django.contrib.auth.models import User
>>> from api.models import UserProfile
>>> user = User.objects.create_user('superadmin', 'super@example.com', 'password123')
>>> profile = UserProfile.objects.create(user=user, role='superadmin')
>>> exit()
```

5. **Update Existing User to Superadmin**
```bash
python manage.py shell
>>> from django.contrib.auth.models import User
>>> from api.models import UserProfile
>>> user = User.objects.get(username='yourusername')
>>> profile, created = UserProfile.objects.get_or_create(user=user)
>>> profile.role = 'superadmin'
>>> profile.save()
>>> print(f"✓ {user.username} is now a {profile.role}")
>>> exit()
```

6. **Run Development Server**
```bash
python manage.py runserver
```

Backend will run at: `http://localhost:8000`

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Run Development Server**
```bash
npm run dev
```

Frontend will run at: `http://localhost:5173`

## Testing the API

### 1. Get Access Token

**Login**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "password123"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Test Superadmin Endpoints

**Get All Users**
```bash
curl -X GET http://localhost:8000/api/superadmin/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Statistics**
```bash
curl -X GET http://localhost:8000/api/superadmin/users/statistics/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Create Admin**
```bash
curl -X POST http://localhost:8000/api/superadmin/users/create_admin/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "email": "admin1@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

**Change User Role**
```bash
curl -X PATCH http://localhost:8000/api/superadmin/users/2/change_role/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### 3. Test Admin Endpoints

**List Regular Users Only**
```bash
curl -X GET http://localhost:8000/api/admin/users/ \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### 4. Test User Endpoints

**Get Own Profile**
```bash
curl -X GET http://localhost:8000/api/user/profile/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Permission Matrix

| Action | Superadmin | Admin | User |
|--------|-----------|-------|------|
| View all users | ✓ | Only regular users | Own only |
| Create users | ✓ Any role | ✓ Regular only | ✗ |
| Update users | ✓ All | ✓ Regular only | Own only |
| Delete users | ✓ All | ✓ Regular only | ✗ |
| Change roles | ✓ | ✗ | ✗ |
| View admins | ✓ | ✗ | ✗ |
| Create admins | ✓ | ✗ | ✗ |
| System stats | ✓ | Limited | Own only |

## Security Features

1. **JWT Authentication**: Secure token-based auth with refresh tokens
2. **Role-Based Access Control (RBAC)**: Hierarchical permission system
3. **Global Middleware**: Automatic role verification on every request
4. **Object-Level Permissions**: Users can only access their own resources
5. **Input Validation**: All endpoints validate input data
6. **CORS Configuration**: Secure cross-origin request handling
7. **Password Hashing**: Django's built-in password hashing
8. **Token Rotation**: Refresh tokens rotate on use

## Next Steps (Frontend)

1. **Create Role-Based Routing**
   - Protected routes by role
   - Automatic redirect based on user role after login

2. **Implement Dashboards**
   - SuperAdmin: User management, system stats, role changes
   - Admin: Regular user management, limited stats
   - User: Profile management, own tasks

3. **Build Components**
   - User tables with Material-UI DataGrid
   - Role change modal (superadmin only)
   - User creation forms
   - Statistics cards

4. **Update Auth Service**
   - Store role in localStorage/context
   - Role-based navigation
   - Automatic logout on 401/403

## Troubleshooting

### Issue: 403 Forbidden
**Solution**: Check user role in database
```bash
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(username='yourname')
>>> print(user.profile.role)
```

### Issue: Middleware not working
**Solution**: Ensure middleware is registered in settings.py after AuthenticationMiddleware

### Issue: Role not appearing in API response
**Solution**: Check serializer includes 'role' field

## Environment Variables

Add to `.env`:
```env
# Database
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=db.ybmkkgctooapcfrpvkuj.supabase.co
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Version

**Current Version**: 1.0 (Initial multi-auth implementation)
**Date**: November 5, 2025

## Tech Stack

**Backend:**
- Django 5.2.7
- Django REST Framework 3.16.1
- djangorestframework-simplejwt 5.5.1
- PostgreSQL (Supabase)

**Frontend:**
- React 19.1.1
- TypeScript
- Material-UI 7.3.5
- Axios 1.13.1
- React Router 7.9.5

---

**Built with Claude Code** - Autonomous implementation of multi-role authentication system.
