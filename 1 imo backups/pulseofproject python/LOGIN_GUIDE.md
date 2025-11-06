# Login Guide - Pulse of People Dashboard

## Problem Fixed

The error you were seeing was caused by **not being logged in**. The 403 Forbidden errors occurred because:
1. You went directly to `/superadmin/dashboard` without authentication
2. The backend requires JWT authentication for all superadmin routes
3. No access token was sent with the API requests

## Solution Implemented

1. Reset passwords for both admin accounts
2. Added login credential hints on the login page
3. Improved route protection and redirects
4. Added version footer (v1.0 - 2025-11-05) to all pages
5. Fixed authentication flow

## How to Login & Access Dashboards

### Step 1: Go to Login Page
Open your browser and navigate to:
```
http://localhost:5173/login
```

### Step 2: Login with Credentials

**For Superadmin Access:**
- Username: `Superadmins`
- Password: `admin123`

**For Admin Access:**
- Username: `admin`
- Password: `admin123`

### Step 3: Automatic Redirect
After successful login, you'll be automatically redirected to:
- Superadmin → `http://localhost:5173/superadmin/dashboard`
- Admin → `http://localhost:5173/admin/dashboard`
- Regular User → `http://localhost:5173/user/dashboard`

## What You'll See After Login

### Superadmin Dashboard Features:
- Total Users count
- Superadmins count
- Admins count
- Regular Users count
- User management table with:
  - View all users
  - Edit user roles
  - Toggle user active/inactive status
  - Add new users
- Material Icons throughout
- Footer with version number

## Testing URLs

### Backend (API):
```bash
# Health Check
curl http://localhost:8000/api/health/

# Login Test
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"Superadmins","password":"admin123"}'
```

### Frontend:
- Home: http://localhost:5173/
- Login: http://localhost:5173/login
- Register: http://localhost:5173/register
- Superadmin Dashboard: http://localhost:5173/superadmin/dashboard (requires login)

## Current Server Status

- Backend: Running on http://localhost:8000
- Frontend: Running on http://localhost:5173
- Database: PostgreSQL (Supabase)

## Architecture Summary

### Backend (Django + DRF):
- JWT Authentication (access + refresh tokens)
- Role-based permissions (superadmin, admin, user)
- RESTful API endpoints
- Middleware for role checking

### Frontend (React + Vite + MUI):
- Material-UI components with Material Icons
- Protected routes with role checking
- JWT token storage in localStorage
- Automatic token refresh on 401 errors

## Troubleshooting

### If you see 403 Forbidden:
1. Make sure you're logged in
2. Check if JWT token is in localStorage (open DevTools → Application → Local Storage)
3. Verify your role matches the required role for the page

### If login fails:
1. Check backend is running: `lsof -ti:8000`
2. Check frontend is running: `lsof -ti:5173`
3. Verify credentials are correct
4. Check browser console for errors

### If redirected to login:
- Your session expired or you're not authenticated
- Simply login again

## Database Users

Current users in the database:
1. **Superadmins** (superadmin@gmail.com) - Role: superadmin - Password: admin123
2. **admin** (admin@gmail.com) - Role: admin - Password: admin123

## Next Steps

1. Login at http://localhost:5173/login
2. Use credentials: `Superadmins` / `admin123`
3. Access the dashboard with full functionality
4. Manage users, roles, and permissions

## Version History

- v1.0 (2025-11-05): Initial release with authentication, role-based access, and user management

---

**Remember:** Always login first before accessing protected routes!
