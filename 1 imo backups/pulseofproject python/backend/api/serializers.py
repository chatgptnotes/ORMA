from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Task, Permission, Notification


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'role', 'bio', 'avatar', 'avatar_url', 'phone', 'date_of_birth', 'permissions', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'permissions']

    def get_permissions(self, obj):
        """Get all permissions for this user"""
        return obj.get_permissions()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'profile']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        """Create user with profile"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        UserProfile.objects.create(user=user)
        return user


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model"""
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'priority', 'owner', 'owner_username', 'due_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Auto-assign owner from request user"""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for updating user roles (superadmin only)"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'role']
        read_only_fields = ['id', 'username', 'email']


class UserManagementSerializer(serializers.ModelSerializer):
    """Serializer for user management (admin/superadmin)"""
    profile = UserProfileSerializer(read_only=True)
    role = serializers.CharField(source='profile.role', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile', 'date_joined', 'last_login', 'is_active']
        read_only_fields = ['id', 'date_joined', 'last_login']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'username', 'title', 'message', 'notification_type',
            'is_read', 'read_at', 'related_model', 'related_id', 'metadata',
            'supabase_id', 'synced_to_supabase', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'supabase_id', 'synced_to_supabase', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Auto-assign user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
