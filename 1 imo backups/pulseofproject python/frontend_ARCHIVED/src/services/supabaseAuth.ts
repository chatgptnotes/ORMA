/**
 * Supabase Authentication Service
 * Handles all authentication operations using Supabase
 */

import { supabase, getSession, getCurrentUser } from '../lib/supabase';
import type { AuthError, User, Session } from '@supabase/supabase-js';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  username?: string;
  metadata?: Record<string, any>;
}

interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Supabase Authentication API
 */
export const supabaseAuthAPI = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 Supabase Login: Attempting login for', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Supabase Login: Failed', error);
      return { user: null, session: null, error };
    }

    console.log('✓ Supabase Login: Success', {
      user_id: data.user?.id,
      email: data.user?.email,
      role: data.user?.app_metadata?.role || data.user?.user_metadata?.role,
    });

    return { user: data.user, session: data.session, error: null };
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('📝 Supabase Register: Creating account for', data.email);

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username || data.email.split('@')[0],
          ...(data.metadata || {}),
        },
      },
    });

    if (error) {
      console.error('❌ Supabase Register: Failed', error);
      return { user: null, session: null, error };
    }

    console.log('✓ Supabase Register: Success', {
      user_id: authData.user?.id,
      email: authData.user?.email,
    });

    return { user: authData.user, session: authData.session, error: null };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    console.log('🚪 Supabase Logout: Signing out');
    await supabase.auth.signOut();
    console.log('✓ Supabase Logout: Success');
  },

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    return await getSession();
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    return await getCurrentUser();
  },

  /**
   * Get user profile with role
   */
  async getProfile(): Promise<{
    id: string;
    email: string;
    username: string;
    role: string;
    metadata: any;
  } | null> {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || user.email?.split('@')[0] || '',
      role: user.app_metadata?.role || user.user_metadata?.role || 'user',
      metadata: {
        ...user.user_metadata,
        ...user.app_metadata,
      },
    };
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session !== null;
  },

  /**
   * Get user role
   */
  async getUserRole(): Promise<string | null> {
    const user = await getCurrentUser();
    if (!user) return null;

    return user.app_metadata?.role || user.user_metadata?.role || 'user';
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    const session = await getSession();
    return session?.access_token || null;
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  },

  /**
   * Update user metadata
   */
  async updateProfile(metadata: Record<string, any>): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    });
    return { error };
  },
};

export default supabaseAuthAPI;
