/**
 * Supabase Client Configuration
 * Central instance for all Supabase operations
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables! Check .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Automatically refresh tokens
    persistSession: true,   // Persist session in localStorage
    detectSessionInUrl: true, // Handle auth callbacks
  },
});

// Helper to get current session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper to get access token
export const getAccessToken = async () => {
  const session = await getSession();
  return session?.access_token || null;
};

// Export type for TypeScript
export type SupabaseClient = typeof supabase;
