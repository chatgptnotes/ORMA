# PassportAI - Complete SaaS Setup Guide

This guide will help you set up the complete SaaS application with Supabase backend.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (https://supabase.com)
- A Google AI Studio account for Gemini API (https://aistudio.google.com)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd passport-data-extractor
npm install
```

### 2. Supabase Setup

1. **Create a new Supabase project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose your organization and enter project details

2. **Set up the database schema:**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL to create all tables, functions, and policies

3. **Set up storage:**
   - Copy and paste the contents of `supabase/storage.sql`
   - Run the SQL to create the documents storage bucket and policies

4. **Get your Supabase credentials:**
   - Go to Settings > API in your Supabase dashboard
   - Copy the Project URL and anon public key

### 3. Environment Configuration

1. **Update the environment file:**
   ```bash
   cp .env.local .env.local.backup
   ```

2. **Edit `.env.local` with your actual credentials:**
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 4. Supabase Authentication Setup

1. **Enable Email Auth:**
   - Go to Authentication > Settings in Supabase
   - Enable "Enable email confirmations" if desired
   - Set your site URL to `http://localhost:3000` for development

2. **Configure Row Level Security:**
   - The schema already includes comprehensive RLS policies
   - All policies are automatically applied when you run the schema SQL

### 5. Test the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser to:**
   ```
   http://localhost:3000
   ```

3. **Test the flow:**
   - Visit the landing page
   - Register a new account
   - Verify your email (if enabled)
   - Login and explore the dashboard
   - Try extracting passport data

## Features Overview

### 🔐 Authentication & Authorization
- Email/password authentication via Supabase Auth
- Role-based access control (superadmin, admin, user)
- Row Level Security (RLS) policies
- Protected routes and components

### 🏢 Multi-tenant Architecture
- Organization-based data isolation
- Role-based permissions within organizations
- Superadmin can manage all organizations

### 📄 Document Processing
- AI-powered passport data extraction using Google Gemini
- Secure document storage in Supabase Storage
- Automatic data validation and processing

### 📊 Dashboard Features
- **User Dashboard:** Personal stats, recent applications, quick actions
- **Admin Dashboard:** Organization management, user oversight, analytics
- **Superadmin Dashboard:** Global system management

### 🔍 Audit & Compliance
- Comprehensive audit logging
- User activity tracking
- Data access monitoring

## Database Schema

The application uses the following main tables:

- **organizations**: Multi-tenant organization management
- **user_profiles**: Extended user information with roles
- **documents**: File metadata and processing status
- **applications**: Form submissions and extracted data
- **audit_logs**: System activity and security logging

## Role Permissions

### User Role
- Extract passport data
- View own applications and documents
- Update own profile

### Admin Role
- All user permissions
- Manage users within their organization
- View organization analytics
- Access audit logs for their organization

### Superadmin Role
- All admin permissions
- Manage all organizations
- Create/modify user roles
- System-wide analytics and monitoring

## Development Notes

### File Structure
```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboards/     # Role-based dashboards
│   └── ...
├── contexts/           # React contexts (Auth)
├── lib/               # Supabase client and utilities
└── services/          # External services (Gemini AI)
```

### Key Components
- `AuthContext`: Manages authentication state and user profiles
- `ProtectedRoute`: Handles route protection and role checking
- `DashboardLayout`: Responsive dashboard with navigation
- `ExtractorApp`: Main passport extraction interface

## Deployment

### Environment Variables for Production
Make sure to set these in your production environment:

```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy automatically

### Supabase Production Setup
1. Upgrade to a paid plan for production use
2. Configure custom domain if needed
3. Set up database backups
4. Monitor usage and performance

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error:**
   - Check that all environment variables are set correctly
   - Restart the development server after changing .env.local

2. **Authentication not working:**
   - Verify Supabase project settings
   - Check that email confirmation is configured properly

3. **File upload failures:**
   - Ensure storage bucket policies are set up correctly
   - Check file size limits (10MB default)

4. **RLS policy errors:**
   - Verify all policies are created from schema.sql
   - Check user roles are set correctly

### Getting Help

- Check the Supabase documentation: https://supabase.com/docs
- Review the application logs in browser console
- Verify database queries in Supabase dashboard

## Next Steps

This is a complete foundation for a SaaS passport extraction service. Consider adding:

- Email notifications for application status changes
- Advanced analytics and reporting
- Integration with payment processing
- Mobile app support
- API documentation for third-party integrations
- Advanced document types (drivers licenses, IDs, etc.)

The application is designed to be scalable and maintainable, ready for production deployment and further feature development.