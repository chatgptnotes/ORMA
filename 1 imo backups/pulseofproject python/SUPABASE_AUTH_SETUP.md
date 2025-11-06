# Supabase Social Auth Configuration Guide

This guide will help you configure Google and GitHub OAuth providers in your Supabase project (pulseofpeople).

## Prerequisites

- Supabase project: **pulseofpeople** (iwtgbseaoztjbnvworyq)
- Access to Supabase Dashboard: https://supabase.com/dashboard
- Google Cloud Console access (for Google OAuth)
- GitHub Developer Settings access (for GitHub OAuth)

## Configuration Overview

You need to configure:
1. **Redirect URLs** in Supabase
2. **Google OAuth** credentials
3. **GitHub OAuth** credentials

---

## Step 1: Configure Site URL and Redirect URLs in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **pulseofpeople** (iwtgbseaoztjbnvworyq)
3. Navigate to **Authentication** → **URL Configuration**
4. Set the following URLs:

   **Site URL:**
   ```
   http://localhost:5176
   ```

   **Redirect URLs (Add all of these):**
   ```
   http://localhost:5176/auth/callback
   http://localhost:5173/auth/callback
   http://localhost:5174/auth/callback
   http://localhost:5175/auth/callback
   ```

5. Click **Save**

---

## Step 2: Configure Google OAuth Provider

### A. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure consent screen if prompted:
   - User Type: **External**
   - App name: **Pulse of People**
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: **Pulse of People Auth**
   - Authorized redirect URIs:
     ```
     https://iwtgbseaoztjbnvworyq.supabase.co/auth/v1/callback
     ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### B. Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Enable the provider (toggle ON)
4. Paste your **Client ID** from Google
5. Paste your **Client Secret** from Google
6. Click **Save**

---

## Step 3: Configure GitHub OAuth Provider

### A. Create GitHub OAuth App

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App**
3. Fill in the details:
   - Application name: **Pulse of People**
   - Homepage URL: `http://localhost:5176`
   - Authorization callback URL:
     ```
     https://iwtgbseaoztjbnvworyq.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy the **Client Secret**

### B. Configure in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **GitHub** and click to expand
3. Enable the provider (toggle ON)
4. Paste your **Client ID** from GitHub
5. Paste your **Client Secret** from GitHub
6. Click **Save**

---

## Step 4: Test the Configuration

1. Ensure both servers are running:
   - Backend: `http://localhost:8000`
   - Frontend: `http://localhost:5176`

2. Navigate to: http://localhost:5176/login

3. You should see:
   - Traditional login form at the top
   - A divider saying "OR CONTINUE WITH"
   - Google and GitHub login buttons below

4. Click on **Google** or **GitHub** button to test the OAuth flow:
   - Should redirect to provider's consent screen
   - After authorization, should redirect back to `/auth/callback`
   - Should then navigate to `/superadmin/dashboard`

---

## Troubleshooting

### Error: "OAuth Error: redirect_uri_mismatch"
- **Solution**: Verify the redirect URL in Google/GitHub exactly matches:
  `https://iwtgbseaoztjbnvworyq.supabase.co/auth/v1/callback`

### Error: "Invalid redirect URL"
- **Solution**: Check that you've added all localhost URLs in Supabase URL Configuration

### Social login buttons not appearing
- **Solution**: Check browser console for errors. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`

### Authentication successful but navigation fails
- **Solution**: Check the `useEffect` in `Login.tsx` and `AuthCallback.tsx` for navigation logic

---

## Next Steps

After configuration:
1. Test both Google and GitHub login flows
2. Verify user data is stored correctly
3. Implement Django backend sync (if needed) to create user records in Django
4. Add proper role assignment for OAuth users
5. Update the callback handler to sync with Django backend

---

## Important Notes

- **Production Setup**: When deploying to production:
  - Update Site URL to your production domain
  - Update redirect URLs in Google/GitHub OAuth apps
  - Add production URLs to Supabase URL Configuration

- **Security**: Never commit OAuth client secrets to version control

- **User Roles**: Currently, OAuth users are assigned 'user' role by default. Modify this in `AuthCallback.tsx` as needed.

---

## Files Modified

- `frontend/src/components/SupabaseAuth.tsx` - Social auth component
- `frontend/src/pages/Login.tsx` - Updated login page with OAuth
- `frontend/src/pages/auth/AuthCallback.tsx` - OAuth callback handler
- `frontend/src/App.tsx` - Added auth callback route
- `frontend/src/lib/supabase.ts` - Supabase client configuration

---

## Support

For issues or questions:
- Supabase Documentation: https://supabase.com/docs/guides/auth
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- GitHub OAuth: https://docs.github.com/en/developers/apps/building-oauth-apps
