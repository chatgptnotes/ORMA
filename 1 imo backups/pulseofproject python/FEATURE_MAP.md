# Pulse of People - Complete Feature Map & File Locations

## Project Overview
**Purpose:** Political intelligence and sentiment analysis platform with role-based user management
**Stack:** Django + React + PostgreSQL (Supabase) + JWT Authentication

---

## 📁 Project Structure

```
pulseofproject python/
├── backend/          # Django REST Framework API
│   ├── api/          # Main application
│   └── config/       # Django settings
└── frontend/         # React + Vite + Material-UI
    └── src/          # Source code
```

---

## 🎯 Features by Role

### 1️⃣ **Public Features** (No Login Required)

| Feature | Frontend Location | Backend Location | Route |
|---------|------------------|-----------------|-------|
| **Home Page** | `frontend/src/pages/Home.tsx` | N/A | `/` |
| **Login Page** | `frontend/src/pages/Login.tsx` | `backend/api/views/legacy.py` (JWT) | `/login` |
| **Register Page** | `frontend/src/pages/Register.tsx` | `backend/api/views/legacy.py` | `/register` |
| **Public Dashboard** | `frontend/src/pages/Dashboard.tsx` | N/A | `/dashboard` |

**API Endpoints:**
- `POST /api/auth/login/` - JWT authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Token refresh
- `GET /api/health/` - Health check

---

### 2️⃣ **Superadmin Features** (Role: superadmin)

#### User Management
| Feature | Frontend Location | Backend Location | Route |
|---------|------------------|-----------------|-------|
| **Dashboard** | `frontend/src/pages/superadmin/SuperAdminDashboardNew.tsx` | `backend/api/views/superadmin/user_management.py` | `/superadmin/dashboard` |
| **User List** | Same as above | `SuperAdminUserManagementViewSet.list()` | `/superadmin/users` |
| **User Statistics** | Same as above | `SuperAdminUserManagementViewSet.statistics()` | `/superadmin/users/statistics/` |
| **Create User** | Same as above (Modal) | `SuperAdminUserManagementViewSet.create_admin()` | `/superadmin/users/create_admin/` |
| **Change Role** | Same as above (Modal) | `SuperAdminUserManagementViewSet.change_role()` | `/superadmin/users/{id}/change_role/` |
| **Toggle Active** | Same as above | `SuperAdminUserManagementViewSet.toggle_active()` | `/superadmin/users/{id}/toggle_active/` |
| **Admin List** | Same as above | `SuperAdminUserManagementViewSet.admins()` | `/superadmin/users/admins/` |

**Components:**
- `frontend/src/components/superadmin/SuperAdminLayout.tsx` - Layout wrapper
- `frontend/src/components/superadmin/Header.tsx` - Top navigation
- `frontend/src/components/superadmin/Sidebar.tsx` - Side navigation
- `frontend/src/components/superadmin/DashboardFooter.tsx` - Version footer

**API Endpoints:**
- `GET /api/superadmin/users/` - List all users (paginated)
- `POST /api/superadmin/users/` - Create new user
- `GET /api/superadmin/users/{id}/` - Get user details
- `PATCH /api/superadmin/users/{id}/` - Update user
- `DELETE /api/superadmin/users/{id}/` - Delete user
- `GET /api/superadmin/users/statistics/` - Get user statistics
- `POST /api/superadmin/users/{id}/toggle_active/` - Toggle user status
- `PATCH /api/superadmin/users/{id}/change_role/` - Change user role
- `GET /api/superadmin/users/admins/` - List admins only
- `POST /api/superadmin/users/create_admin/` - Create admin user

#### Subdomain Management
| Feature | Frontend Location | Backend Location | Route |
|---------|------------------|-----------------|-------|
| **Subdomains** | `frontend/src/pages/superadmin/Subdomains.tsx` | Not yet implemented | `/superadmin/subdomains` |

#### Landing Page Management
| Feature | Frontend Location | Backend Location | Route |
|---------|------------------|-----------------|-------|
| **Landing Pages** | `frontend/src/pages/superadmin/LandingPages.tsx` | Not yet implemented | `/superadmin/landing-pages` |

---

### 3️⃣ **Admin Features** (Role: admin)

| Feature | Frontend Location | Backend Location | Route |
|---------|------------------|-----------------|-------|
| **Admin Dashboard** | `frontend/src/pages/admin/AdminDashboard.tsx` | `backend/api/views/admin/user_management.py` | `/admin/dashboard` |
| **User Management** | Same as above | `AdminUserManagementViewSet` | `/admin/users` |

**Components:**
- `frontend/src/components/admin/` (directory exists, components TBD)

**API Endpoints:**
- `GET /api/admin/users/` - List regular users only (admins can't see other admins)
- `POST /api/admin/users/` - Create regular user
- `PATCH /api/admin/users/{id}/` - Update regular user
- `DELETE /api/admin/users/{id}/` - Delete regular user

**Note:** Admins can only manage regular users, not other admins or superadmins

---

### 4️⃣ **User Features** (Role: user)

| Feature | Frontend Location | Backend Location | Route |
|---------|------------------|-----------------|-------|
| **User Dashboard** | `frontend/src/pages/user/UserDashboard.tsx` | `backend/api/views/user/profile.py` | `/user/dashboard` |
| **Profile View** | Same as above | `UserProfileViewSet` | `/user/profile` |
| **Profile Edit** | Same as above | `UserProfileViewSet.update()` | `/user/profile/me` |

**Components:**
- `frontend/src/components/user/` (directory exists, components TBD)

**API Endpoints:**
- `GET /api/profile/me/` - Get current user profile
- `PATCH /api/profile/me/` - Update current user profile
- `GET /api/user/tasks/` - Get user's tasks
- `POST /api/user/tasks/` - Create task
- `PATCH /api/user/tasks/{id}/` - Update task
- `DELETE /api/user/tasks/{id}/` - Delete task

---

## 🔐 Authentication & Authorization

### Authentication System
**Location:** `backend/api/urls/__init__.py` + DRF SimpleJWT

**Features:**
- JWT token-based authentication
- Access token (1 hour expiry)
- Refresh token (7 days expiry)
- Automatic token rotation
- Token blacklisting after rotation

**Files:**
- `frontend/src/services/api.ts` - Axios interceptors for token management
- `backend/config/settings.py` - JWT configuration (SIMPLE_JWT)

### Permission System
**Location:** `backend/api/permissions/role_permissions.py`

**Permission Classes:**
1. `IsSuperAdmin` - Only superadmins
2. `IsAdminOrAbove` - Admins + Superadmins
3. `IsAdmin` - Only admins
4. `IsUser` - Any authenticated user
5. `IsOwnerOrAdminOrAbove` - Object owner or admin+
6. `CanManageUsers` - User management permission
7. `CanChangeRole` - Only superadmins
8. `ReadOnlyOrAdmin` - Read for all, write for admins+

### Middleware
**Location:** `backend/api/middleware/role_auth_middleware.py`

**Classes:**
1. `RoleAuthMiddleware` - Attaches role info to request
2. `RequestLoggingMiddleware` - Logs all API requests

---

## 📊 Database Models

**Location:** `backend/api/models.py`

### UserProfile Model
```python
Fields:
- user (OneToOne to Django User)
- role (superadmin/admin/user)
- bio
- avatar (ImageField)
- phone
- date_of_birth
- created_at
- updated_at

Methods:
- is_superadmin()
- is_admin()
- is_user()
- is_admin_or_above()
```

### Task Model (Sample/Demo)
```python
Fields:
- title
- description
- status (pending/in_progress/completed/cancelled)
- priority (low/medium/high/urgent)
- owner (ForeignKey to User)
- due_date
- created_at
- updated_at
```

---

## 🛣️ Routing Structure

### Frontend Routes (`frontend/src/App.tsx`)

```javascript
Public Routes:
├── /                     → Home
├── /login               → Login
├── /register            → Register
└── /dashboard           → Public Dashboard

Protected Routes:
├── /superadmin/*
│   ├── /dashboard       → Superadmin Dashboard
│   ├── /users          → User Management
│   ├── /subdomains     → Subdomain Management
│   └── /landing-pages  → Landing Page Management
│
├── /admin/*
│   └── /dashboard       → Admin Dashboard
│
└── /user/*
    └── /dashboard       → User Dashboard
```

### Backend Routes (`backend/api/urls/`)

```
Main Router: backend/api/urls/__init__.py
├── /api/health/                    → Health check
├── /api/auth/login/               → JWT login
├── /api/auth/refresh/             → JWT refresh
├── /api/auth/register/            → User registration
├── /api/profile/me/               → Current user profile
│
├── /api/superadmin/*              → Include superadmin_urls.py
│   └── /users/*                   → SuperAdminUserManagementViewSet
│
├── /api/admin/*                   → Include admin_urls.py
│   └── /users/*                   → AdminUserManagementViewSet
│
└── /api/user/*                    → Include user_urls.py
    └── /profile/*                 → UserProfileViewSet
```

---

## 🎨 UI Components

### Layout Components
| Component | Location | Purpose |
|-----------|----------|---------|
| **Layout** | `frontend/src/components/Layout.tsx` | Public page wrapper |
| **DashboardLayout** | `frontend/src/components/DashboardLayout.tsx` | Dashboard wrapper |
| **SuperAdminLayout** | `frontend/src/components/superadmin/SuperAdminLayout.tsx` | Superadmin page wrapper |
| **Header** | `frontend/src/components/superadmin/Header.tsx` | Top navigation bar |
| **Sidebar** | `frontend/src/components/superadmin/Sidebar.tsx` | Side navigation menu |
| **Footer** | `frontend/src/components/Footer.tsx` | Global footer |
| **DashboardFooter** | `frontend/src/components/superadmin/DashboardFooter.tsx` | Dashboard footer with version |

### Reusable Components
- Material-UI components (Button, Card, Table, etc.)
- Custom icons from Material Icons pack
- Form components (TextField, Select, etc.)
- Modal dialogs (Role change, Add user, etc.)

---

## 🔧 Services & Utilities

### Frontend Services
**Location:** `frontend/src/services/api.ts`

**Exports:**
- `api` - Axios instance with interceptors
- `authAPI` - Authentication methods
  - `login(username, password)`
  - `register(userData)`
  - `getProfile()`
  - `logout()`
  - `isAuthenticated()`
  - `getUserRole()`
- `userAPI` - User profile methods
  - `getProfile()`
  - `updateProfile(data)`
- `taskAPI` - Task management methods
  - `getTasks()`
  - `getTask(id)`
  - `createTask(data)`
  - `updateTask(id, data)`
  - `deleteTask(id)`
- `healthCheck()` - Health check

### Backend Serializers
**Location:** `backend/api/serializers.py`

**Classes:**
1. `UserProfileSerializer` - User profile data
2. `UserSerializer` - User registration
3. `TaskSerializer` - Task data
4. `UserRoleSerializer` - Role management
5. `UserManagementSerializer` - Admin user management

---

## 📱 Current Implementation Status

### ✅ Fully Implemented
- User authentication (Login/Register)
- JWT token management
- Role-based permissions
- Superadmin dashboard
- User statistics
- User list with pagination
- Create/Edit/Delete users
- Change user roles
- Toggle user active status
- Material-UI design system
- Responsive layout
- Protected routes

### 🚧 Partially Implemented
- Admin dashboard (UI exists, needs backend integration)
- User dashboard (UI exists, needs features)
- Task management (models exist, needs full CRUD)

### 📋 Not Yet Implemented
- Subdomain management
- Landing page management
- Political sentiment analysis features
- Voter database
- Social media tracking
- Regional sentiment maps
- Analytics dashboard
- Export/Import functionality
- Email notifications
- Audit logs

---

## 🗄️ Database Schema

**Database:** PostgreSQL (Supabase)
**Connection:** `backend/config/settings.py` (DATABASES)

**Tables:**
1. `auth_user` - Django default user table
2. `api_userprofile` - Extended user profiles
3. `api_task` - Sample task management

**Relationships:**
- User ↔ UserProfile (One-to-One)
- User ↔ Task (One-to-Many)

---

## 🔍 Key Feature Details

### User Management Dashboard
**File:** `frontend/src/pages/superadmin/SuperAdminDashboardNew.tsx`

**Features:**
- Statistics cards (Total Users, Superadmins, Admins, Regular Users)
- Searchable user table
- Role-based filtering
- Avatar with initials
- Color-coded role badges
- Active/Inactive status indicators
- Edit role modal
- Add user modal
- Toggle active/inactive button
- Real-time data refresh

**Backend ViewSet:** `SuperAdminUserManagementViewSet`
**API:** `GET /api/superadmin/users/`

---

## 📖 Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| **settings.py** | Django configuration | `backend/config/settings.py` |
| **urls.py** | Main URL router | `backend/config/urls.py` |
| **.env** | Environment variables | `backend/.env` |
| **package.json** | NPM dependencies | `frontend/package.json` |
| **vite.config.ts** | Vite configuration | `frontend/vite.config.ts` |
| **tsconfig.json** | TypeScript config | `frontend/tsconfig.json` |

---

## 🚀 How Features Connect

### Example: User Login Flow

1. **Frontend:** User enters credentials in `Login.tsx`
2. **API Call:** `authAPI.login()` in `services/api.ts`
3. **Backend:** `POST /api/auth/login/` → `TokenObtainPairView` (SimpleJWT)
4. **Database:** Validates against `auth_user` table
5. **Response:** Returns JWT access + refresh tokens
6. **Storage:** Tokens saved to localStorage
7. **Profile:** `GET /api/profile/me/` fetches user profile + role
8. **Navigation:** Redirects based on role:
   - superadmin → `/superadmin/dashboard`
   - admin → `/admin/dashboard`
   - user → `/user/dashboard`

### Example: View Users Flow

1. **Frontend:** `SuperAdminDashboardNew.tsx` mounts
2. **useEffect:** Calls `fetchData()`
3. **API Call:** `api.get('/superadmin/users/')`
4. **Interceptor:** Adds `Bearer {token}` header
5. **Backend:** `GET /api/superadmin/users/` → `SuperAdminUserManagementViewSet.list()`
6. **Permission:** `IsSuperAdmin` checks `request.user.profile.role == 'superadmin'`
7. **Database:** Queries `auth_user` JOIN `api_userprofile`
8. **Response:** Returns paginated JSON: `{count: N, results: [...]}`
9. **Frontend:** Extracts `data.results`, updates state
10. **Render:** Displays users in Material-UI table

---

## 📝 Notes

- **Version:** v1.0 (2025-11-05)
- **Design System:** Material-UI (MUI) v5
- **Icons:** Material Icons only (no emojis as per CLAUDE.md)
- **Footer:** Version number on every page
- **Authentication:** JWT with automatic refresh
- **CORS:** Enabled for localhost:5173

---

## 🎯 Feature Priority (Based on Current Implementation)

**High Priority (Core Features):**
1. ✅ Authentication & Authorization
2. ✅ User Management (Superadmin)
3. 🚧 Admin Dashboard Features
4. 🚧 User Profile Management

**Medium Priority (Platform Features):**
5. ⏳ Political Sentiment Analysis
6. ⏳ Voter Database
7. ⏳ Regional Analytics
8. ⏳ Social Media Tracking

**Low Priority (Additional Features):**
9. ⏳ Subdomain Management
10. ⏳ Landing Page Builder
11. ⏳ Email Notifications
12. ⏳ Advanced Reporting

---

**Legend:**
- ✅ Complete
- 🚧 In Progress
- ⏳ Planned
- ❌ Not Started

---

This feature map is accurate as of **November 5, 2025** based on the current codebase state.
