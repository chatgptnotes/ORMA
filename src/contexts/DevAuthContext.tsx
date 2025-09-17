import React, { createContext, useContext, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';

// Mock user for development
const MOCK_USER: User = {
  id: 'dev-user-123',
  email: 'dev@orma.com',
  app_metadata: {},
  user_metadata: { full_name: 'Development User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

const MOCK_SESSION: Session = {
  access_token: 'dev-access-token',
  refresh_token: 'dev-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER,
} as Session;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // In development mode, always return authenticated user
  const isDevelopment = import.meta.env.DEV || true;
  
  const [user] = useState<User | null>(isDevelopment ? MOCK_USER : null);
  const [session] = useState<Session | null>(isDevelopment ? MOCK_SESSION : null);
  const [loading] = useState(false);

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('Dev mode: Mock signup', { email, fullName });
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Dev mode: Mock signin', { email });
    return { error: null };
  };

  const signOut = async () => {
    console.log('Dev mode: Mock signout');
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    console.log('Dev mode: Mock password reset', { email });
    return { error: null };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};