# Admin Setup Guide

## Overview

The passport data extractor application has role-based access control with three user roles:
- **User**: Can submit applications via the public form
- **Admin**: Can access dashboard, view all applications, and manage data
- **Superadmin**: Has all admin privileges plus system configuration access

## Setting Up Admin Access

### Prerequisites
- Supabase project with authentication enabled
- Database tables created (run the SQL scripts in `/supabase` folder)

### Step 1: Create Admin User

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Invite User"** or **"Add User"**
5. Enter the admin details:
   - Email: `admin@orma.com` (or your preferred email)
   - Password: Choose a strong password
   - Auto-confirm email: Yes (for immediate access)

#### Option B: Using the Sign-Up Page

1. Go to `/register` in your application
2. Sign up with admin email and password
3. Confirm the email if required

### Step 2: Grant Admin Role

After creating the user, you need to update their role in the database:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run the following SQL command (replace email with your admin's email):

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@orma.com';
```

### Step 3: Verify Admin Access

1. Go to your application
2. Navigate to `/login`
3. Sign in with your admin credentials:
   - Email: `admin@orma.com`
   - Password: [Your chosen password]
4. You should now have access to:
   - `/dashboard` - Admin dashboard
   - `/applications` - View all submitted applications
   - `/application/:id` - View individual application details

## Default Admin Credentials (For Testing)

If you want to set up a test admin account:

```
Email: admin@orma.com
Password: Admin@123456 (Change this immediately!)
```

**⚠️ IMPORTANT**: Always change default passwords before deploying to production!

## Troubleshooting

### "Access Denied" Error
If you see "Access Denied" when trying to access admin pages:
1. Verify the user exists in `auth.users` table
2. Check if a corresponding record exists in `user_profiles` table
3. Ensure the `role` field is set to `'admin'` or `'superadmin'`

### User Profile Not Created
If the user profile is not automatically created:
1. Manually insert the profile:

```sql
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
FROM auth.users
WHERE email = 'admin@orma.com';
```

### Reset Admin Password
To reset an admin password:
1. Go to Supabase Dashboard → Authentication → Users
2. Find the admin user
3. Click the three dots menu → "Send Password Reset"
4. Or use the "Reset Password" link on the login page

## Security Best Practices

1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, and symbols
2. **Enable 2FA**: Configure two-factor authentication in Supabase
3. **Limit Admin Access**: Only grant admin role to trusted users
4. **Regular Audits**: Review admin access logs regularly
5. **Rotate Credentials**: Change passwords periodically

## Additional Configuration

### Creating Multiple Admins
To create additional admin users, repeat the process above with different email addresses.

### Revoking Admin Access
To remove admin privileges:

```sql
UPDATE user_profiles
SET role = 'user'
WHERE email = 'former-admin@orma.com';
```

### Viewing All Admins
To see all users with admin access:

```sql
SELECT email, full_name, role, last_login_at
FROM user_profiles
WHERE role IN ('admin', 'superadmin')
ORDER BY created_at DESC;
```

## Support

For issues or questions about admin setup, please check:
1. Supabase logs for authentication errors
2. Browser console for client-side errors
3. Network tab for API response errors