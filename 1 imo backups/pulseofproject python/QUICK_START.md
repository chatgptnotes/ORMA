# Quick Start Guide - Multi-Tenant Platform

**Version**: 1.8 - Phase 1 Complete
**Date**: November 6, 2025

---

## What's Been Implemented

Phase 1 of the multi-tenant platform roadmap is complete! Here's what you can now use:

### ✅ Multi-Tenancy Infrastructure
- Path-based organization detection: `/api/org/{org_slug}/...`
- Automatic tenant scoping for database queries
- Cross-tenant access prevention
- Superadmin multi-tenant capabilities

### ✅ Permission System
- 7 roles: superadmin, admin, manager, analyst, user, viewer, volunteer
- Granular permission checking
- Function decorators and DRF permission classes

### ✅ Service Layer
- UserService, OrganizationService, NotificationService, AuditService
- Clean separation of business logic from views
- Automatic audit logging

### ✅ Production Configuration
- Supabase PostgreSQL support
- HTTPS/SSL security
- CORS for pulseofpeople.com
- Comprehensive environment variables

---

## Quick Setup (5 minutes)

### 1. Backend Setup

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or: venv\Scripts\activate  # On Windows

# Install dependencies (if needed)
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend will run on: **http://localhost:8000**

### 2. Test the API

Visit: http://localhost:8000/admin
- Login with superuser credentials
- Create an Organization (name: "Acme Corp", slug: "acme-corp")
- Create some users with different roles

---

## Testing Multi-Tenancy

### 1. Test Organization Detection

```bash
# This should return 404 - organization not found
curl http://localhost:8000/api/org/nonexistent/users/

# This should work (after creating organization "acme-corp")
curl http://localhost:8000/api/org/acme-corp/users/
```

### 2. Test Tenant-Scoped Queries

In Django shell (`python manage.py shell`):

```python
from django.contrib.auth.models import User
from api.models import Task, Organization

# Create test organization
org = Organization.objects.create(name="Test Org", slug="test-org")

# Create user for organization
user = User.objects.create_user(username='testuser', password='test123')
user.profile.organization = org
user.profile.save()

# Create tasks
task1 = Task.objects.create(title="Task 1", owner=user, organization=org)

# Tenant-scoped query (simulating request)
class MockRequest:
    tenant = org

request = MockRequest()
tasks = Task.objects.for_request(request).all()
print(f"Found {tasks.count()} tasks for organization")
```

### 3. Test Service Layer

In Django shell:

```python
from api.services import UserService, OrganizationService
from api.models import Organization

# Create organization using service
org_service = OrganizationService()
org = org_service.create_organization(
    name="Service Test Org",
    subscription_tier="premium",
    max_users=50
)

print(f"Created: {org.name} (slug: {org.slug})")

# Create user using service
from django.contrib.auth.models import User
admin = User.objects.get(username='admin')  # Your superuser

user_service = UserService(user=admin, organization=org)
new_user = user_service.create_user_with_profile(
    username="serviceuser",
    email="service@test.com",
    password="secure123",
    organization=org,
    role="user"
)

print(f"Created user: {new_user.username}")
```

### 4. Test Permission Decorators

Create a test view in `backend/api/views.py`:

```python
from api.decorators import require_permission, require_role, superadmin_required
from django.http import JsonResponse

@require_permission('users.create')
def test_permission_view(request):
    return JsonResponse({'message': 'You have permission!'})

@require_role('admin', 'manager')
def test_role_view(request):
    return JsonResponse({'message': 'You are an admin or manager!'})

@superadmin_required
def test_superadmin_view(request):
    return JsonResponse({'message': 'You are a superadmin!'})
```

---

## Configuration Options

### Development (Default)
Uses SQLite database - no setup required!

```env
# .env (or use defaults)
DEBUG=True
USE_SQLITE=True
```

### Production (Supabase PostgreSQL)

Update `.env` file:

```env
DEBUG=False
USE_SQLITE=False

# Supabase Database
DB_NAME=postgres
DB_USER=postgres.your-project-ref
DB_PASSWORD=your_database_password
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_SSLMODE=require

# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Domain
ALLOWED_HOSTS=pulseofpeople.com,www.pulseofpeople.com,api.pulseofpeople.com
CORS_ALLOWED_ORIGINS=https://pulseofpeople.com,https://www.pulseofpeople.com
```

---

## Available API Patterns

### Tenant-Scoped Endpoints
All org-specific endpoints use this pattern:

```
/api/org/{org_slug}/{resource}/

Examples:
GET  /api/org/acme-corp/users/           # List users in acme-corp
POST /api/org/acme-corp/tasks/           # Create task in acme-corp
GET  /api/org/acme-corp/notifications/   # Get notifications for acme-corp
```

### System Endpoints (No Tenant Required)
```
POST /api/auth/login/         # Login
POST /api/auth/register/      # Register
POST /api/auth/refresh/       # Refresh token
GET  /api/health/             # Health check
GET  /api/docs/               # API documentation (coming in Phase 2)
```

---

## Using the Service Layer

Always use services for business logic:

```python
# ❌ DON'T: Put business logic in views
def create_user_view(request):
    user = User.objects.create(...)
    profile = UserProfile.objects.create(...)
    # ... lots of logic

# ✅ DO: Use service layer
from api.services import UserService

def create_user_view(request):
    service = UserService(user=request.user, organization=request.tenant)
    new_user = service.create_user_with_profile(
        username=request.POST['username'],
        email=request.POST['email'],
        password=request.POST['password'],
        organization=request.tenant,
        role='user'
    )
    return JsonResponse({'user_id': new_user.id})
```

---

## Common Tasks

### Create Organization via Django Shell
```python
from api.services import OrganizationService

service = OrganizationService()
org = service.create_organization(
    name="My Company",
    subscription_tier="basic",
    max_users=10
)
```

### Assign User to Organization
```python
from api.services import UserService
from django.contrib.auth.models import User
from api.models import Organization

user = User.objects.get(username='john')
org = Organization.objects.get(slug='acme-corp')

service = UserService()
service.assign_user_to_organization(user, org)
```

### Change User Role
```python
from api.services import UserService
from django.contrib.auth.models import User

admin = User.objects.get(username='admin')
target_user = User.objects.get(username='john')

service = UserService(user=admin)
service.assign_role(target_user, 'manager')
```

### Send Notification
```python
from api.services import NotificationService
from django.contrib.auth.models import User

user = User.objects.get(username='john')

service = NotificationService()
notification = service.create_notification(
    user=user,
    title="Welcome!",
    message="Welcome to our platform!",
    notification_type="info"
)
```

---

## Troubleshooting

### Issue: "Organization not found"
**Solution**: Make sure you've created an organization with the slug you're using in the URL

```python
# In Django shell
from api.models import Organization
Organization.objects.create(name="Acme Corp", slug="acme-corp")
```

### Issue: "Permission denied"
**Solution**: Check that your user has the required role or permission

```python
# In Django shell
from django.contrib.auth.models import User
user = User.objects.get(username='youruser')
print(f"Role: {user.profile.role}")
print(f"Permissions: {user.profile.get_permissions()}")
```

### Issue: "User profile not found"
**Solution**: Create a profile for the user

```python
from django.contrib.auth.models import User
from api.models import UserProfile, Organization

user = User.objects.get(username='youruser')
org = Organization.objects.first()

UserProfile.objects.create(
    user=user,
    organization=org,
    role='user'
)
```

---

## Next Steps

### What's Coming in Phase 2
- 🔮 Sentiment Analysis API
- 📚 API Documentation (Swagger/OpenAPI)
- 📝 Automatic Audit Logging Middleware
- ⚛️ React Service Layer Updates
- 🎨 Tenant-Aware React Routing
- 🧪 Comprehensive Testing

### Want to Contribute?
Check `ROADMAP.md` for the complete 12-week plan!

---

## Useful Commands

```bash
# Backend
python manage.py runserver              # Start server
python manage.py shell                  # Django shell
python manage.py makemigrations         # Create migrations
python manage.py migrate                # Apply migrations
python manage.py createsuperuser        # Create admin user
python manage.py check                  # Check for issues

# Database
python manage.py dbshell                # Database shell (SQLite)

# Testing (coming in Phase 2)
python manage.py test                   # Run tests
```

---

## Support

- 📖 **Documentation**: See `ROADMAP.md`, `IMPLEMENTATION_PHASE_1_COMPLETE.md`
- 🐛 **Issues**: Check the implementation docs for troubleshooting
- 💡 **Questions**: Review the service layer examples

---

**Version**: v1.8 - 2025-11-06

---

*Happy building! 🚀*
