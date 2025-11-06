export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile?: UserProfile;
}

export type UserRole = 'superadmin' | 'admin' | 'user';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  bio?: string;
  avatar?: string;
  phone?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  owner: number;
  owner_username: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface UserManagement {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  profile?: UserProfile;
  date_joined: string;
  last_login?: string;
  is_active: boolean;
}

export interface UserStatistics {
  total_users: number;
  superadmins?: number;
  admins?: number;
  users?: number;
  active_users: number;
  inactive_users: number;
}
