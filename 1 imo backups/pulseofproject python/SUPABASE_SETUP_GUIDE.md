# Supabase Authentication Setup Guide

## Overview
This guide explains how to set up and use the new Supabase-based authentication system integrated with the Pulse of People Django backend.

## Architecture: Unified Authentication

**Strategy:** Supabase as Primary Auth Provider + Django Backend Validation

### Flow:
1. User logs in via Supabase authentication
2. Frontend receives Supabase JWT token
3. Frontend sends token to Django API in Authorization header
4. Django validates Supabase JWT token
5. Django creates/syncs local user record
6. Both systems work together seamlessly

### Benefits:
- Single source of truth for authentication
- Automatic token refresh (handled by Supabase)
- Built-in user management UI (Supabase dashboard)
- No manual token refresh logic needed
- Gradual migration path from Django JWT

---

## Files Modified/Created

### Backend Changes

#### 1. `/backend/api/authentication.py` (NEW)
**Purpose:** Django REST Framework authentication class for Supabase JWT tokens

**Key Classes:**
- `SupabaseJWTAuthentication` - Validates Supabase JWT tokens
- `HybridAuthentication` - Supports both Supabase and Django JWT (migration period)

**How it works:**
1. Extracts JWT token from Authorization header
2. Validates token using Supabase JWT secret
3. Creates/updates Django user from Supabase user data
4. Syncs role from Supabase metadata to UserProfile

#### 2. `/backend/config/settings.py`
**Changes:**
- Added Supabase configuration variables:
  ```python
  SUPABASE_URL = config('SUPABASE_URL', default='')
  SUPABASE_ANON_KEY = config('SUPABASE_ANON_KEY', default='')
  SUPABASE_JWT_SECRET = config('SUPABASE_JWT_SECRET', default='')
  ```

- Updated REST Framework authentication:
  ```python
  REST_FRAMEWORK = {
      'DEFAULT_AUTHENTICATION_CLASSES': (
          'api.authentication.HybridAuthentication',
          'rest_framework_simplejwt.authentication.JWTAuthentication',
      ),
      ...
  }
  ```

#### 3. `/backend/.env.example`
**Added:**
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-here
```

### Frontend Changes

#### 1. `/frontend/src/lib/supabase.ts` (NEW)
**Purpose:** Supabase client configuration

**Exports:**
- `supabase` - Configured Supabase client
- `getSession()` - Get current user session
- `getCurrentUser()` - Get current authenticated user
- `getAccessToken()` - Get JWT access token

#### 2. `/frontend/src/services/supabaseAuth.ts` (NEW)
**Purpose:** Complete authentication service using Supabase

**Available Methods:**
- `login(email, password)` - Sign in with email/password
- `register(data)` - Create new account
- `logout()` - Sign out user
- `getProfile()` - Get user profile with role
- `isAuthenticated()` - Check if user is logged in
- `getUserRole()` - Get user's role
- `getAccessToken()` - Get current JWT token
- `onAuthStateChange(callback)` - Listen to auth state changes
- `resetPassword(email)` - Send password reset email
- `updatePassword(newPassword)` - Update user password
- `updateProfile(metadata)` - Update user metadata

#### 3. `/frontend/src/pages/Login.tsx`
**Changes:**
- Changed from Django JWT auth to Supabase auth
- Updated form field from "username" to "email"
- Updated login logic to use `supabaseAuthAPI.login()`
- Updated credential hints to show email addresses

#### 4. `/frontend/src/services/api.ts`
**Changes:**
- Updated request interceptor to use Supabase tokens
- Imported `getAccessToken` from Supabase lib
- Falls back to Django JWT for backward compatibility
- Simplified token refresh (Supabase handles it automatically)

#### 5. `/frontend/.env.example`
**Added:**
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

## Setup Instructions

### Step 1: Supabase Project Setup

1. **Create Supabase Project:**
   - Go to https://supabase.com
   - Sign up / Log in
   - Click "New Project"
   - Fill in project details
   - Wait for project to be created

2. **Get API Keys:**
   - Go to Project Settings > API
   - Copy the following:
     - Project URL: `https://xxx.supabase.co`
     - Anon/Public Key: `eyJhbGc...` (public key)
     - Service Role Key: `eyJhbGc...` (secret key)

3. **Get JWT Secret:**
   - Go to Project Settings > API > JWT Settings
   - Copy the JWT Secret (under "JWT Secret")
   - This is used by Django to verify tokens

### Step 2: Configure User Authentication

1. **Enable Email/Password Auth:**
   - Go to Authentication > Providers
   - Enable "Email" provider
   - Configure email templates if needed

2. **Create Test Users:**
   ```sql
   -- Run this in Supabase SQL Editor
   -- Supabase will automatically create auth.users entries
   ```

   Or use Supabase Dashboard:
   - Go to Authentication > Users
   - Click "Add User"
   - Enter email and password
   - Add user_metadata with role:
     ```json
     {
       "username": "Superadmins",
       "role": "superadmin"
     }
     ```

3. **Set Up User Metadata:**
   - Each user should have these metadata fields:
     ```json
     {
       "username": "string",
       "role": "superadmin|admin|user",
       "first_name": "string",
       "last_name": "string"
     }
     ```

### Step 3: Update Environment Variables

#### Backend (.env)
```bash
# Supabase Authentication
SUPABASE_URL=https://ybmkkgctooapcfrpvkuj.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_JWT_SECRET=your-actual-jwt-secret-here
```

#### Frontend (.env)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://ybmkkgctooapcfrpvkuj.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Step 4: Restart Services

```bash
# Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

---

## User Migration Strategy

### Approach: Gradual Migration

Since we're using `HybridAuthentication`, both auth methods work simultaneously:

1. **Existing Users (Django JWT):** Continue working as before
2. **New Users (Supabase):** Use Supabase authentication
3. **Migration Path:** Gradually move existing users to Supabase

### Migration Steps (Future)

1. **Export Existing Users:**
   ```bash
   python manage.py dumpdata auth.User api.UserProfile > users.json
   ```

2. **Create Script to Import to Supabase:**
   ```python
   # Example migration script
   from supabase import create_client
   from django.contrib.auth.models import User

   supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

   for user in User.objects.all():
       supabase.auth.admin.create_user({
           "email": user.email,
           "password": "temporary_password_123",
           "email_confirm": True,
           "user_metadata": {
               "username": user.username,
               "role": user.profile.role,
               "first_name": user.first_name,
               "last_name": user.last_name,
           }
       })
   ```

3. **Notify Users:** Send email to reset password in new system

---

## Testing the Integration

### Test Login Flow

1. **Open Frontend:** http://localhost:5173/login

2. **Create Test User in Supabase:**
   - Email: superadmin@gmail.com
   - Password: admin123
   - User Metadata:
     ```json
     {
       "username": "Superadmins",
       "role": "superadmin"
     }
     ```

3. **Login:**
   - Enter email: superadmin@gmail.com
   - Enter password: admin123
   - Click "Login"

4. **Verify:**
   - Should redirect to /superadmin/dashboard
   - Check browser console for logs
   - Check localStorage for user_role, username, user_email

### Test API Calls

```bash
# Login and get token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@gmail.com", "password": "admin123"}'

# Use token to access protected endpoint
curl -X GET http://localhost:8000/api/superadmin/users/ \
  -H "Authorization: Bearer <supabase-jwt-token>"
```

### Check Django User Creation

```bash
# Django shell
python manage.py shell

>>> from django.contrib.auth.models import User
>>> User.objects.all()
# Should see user created from Supabase login

>>> user = User.objects.get(email='superadmin@gmail.com')
>>> user.profile.role
# Should show 'superadmin'
```

---

## Troubleshooting

### Issue: "Invalid token" error

**Cause:** JWT secret mismatch

**Fix:**
1. Verify SUPABASE_JWT_SECRET in backend/.env matches Supabase dashboard
2. Restart Django server
3. Clear browser localStorage
4. Login again

### Issue: User created but wrong role

**Cause:** User metadata not set correctly in Supabase

**Fix:**
1. Go to Supabase Dashboard > Authentication > Users
2. Click on user
3. Update user_metadata to include role:
   ```json
   {
     "username": "username",
     "role": "superadmin"
   }
   ```
4. Login again

### Issue: 401 Unauthorized after some time

**Cause:** Token expired and refresh failed

**Fix:**
- Supabase handles token refresh automatically
- Check browser console for errors
- Verify `autoRefreshToken: true` in supabase.ts
- Clear localStorage and login again

### Issue: Django not creating user

**Cause:** Database connection or UserProfile model issue

**Fix:**
1. Check Django logs
2. Verify database connection
3. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

---

## API Reference

### Supabase Auth API

#### Login
```typescript
const { user, session, error } = await supabaseAuthAPI.login(
  'user@example.com',
  'password123'
);
```

#### Register
```typescript
const { user, session, error } = await supabaseAuthAPI.register({
  email: 'user@example.com',
  password: 'password123',
  username: 'johndoe',
  metadata: {
    role: 'user',
    first_name: 'John',
    last_name: 'Doe'
  }
});
```

#### Get Profile
```typescript
const profile = await supabaseAuthAPI.getProfile();
// Returns: { id, email, username, role, metadata }
```

#### Logout
```typescript
await supabaseAuthAPI.logout();
```

---

## Security Considerations

1. **JWT Secret Protection:**
   - Never commit SUPABASE_JWT_SECRET to git
   - Use environment variables only
   - Rotate secret periodically

2. **Token Storage:**
   - Tokens stored in Supabase's secure storage
   - Automatic token refresh prevents expiration issues
   - Logout clears all stored tokens

3. **Role Management:**
   - Roles stored in Supabase user_metadata
   - Synced to Django UserProfile on each login
   - Django validates roles on every API request

4. **CORS Configuration:**
   - Ensure CORS_ALLOWED_ORIGINS includes your frontend URL
   - Don't use wildcards (*) in production

---

## Next Steps

1. **Row Level Security (RLS):** Set up Supabase RLS policies for direct database access
2. **Social Auth:** Add Google/GitHub login via Supabase
3. **Email Verification:** Enable email confirmation for new signups
4. **Password Reset:** Implement password reset flow
5. **User Migration:** Create script to migrate existing users
6. **Audit Logs:** Track authentication events

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs/guides/auth
- **Django DRF Auth:** https://www.django-rest-framework.org/api-guide/authentication/
- **JWT.io:** https://jwt.io/ (token debugger)
- **Project Repo:** https://github.com/chatgptnotes/voter

---

**Version:** 1.1
**Date:** 2025-11-05
**Status:** Production Ready

---

## Changelog

### v1.1 (2025-11-05)
- Implemented Supabase authentication
- Created HybridAuthentication for gradual migration
- Updated Login.tsx to use Supabase
- Modified api.ts to attach Supabase tokens
- Added comprehensive documentation

### v1.0 (2025-11-05)
- Initial Django JWT implementation
- Basic user management features
- Role-based permissions
