import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to get current user profile with organization
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
};

// Helper function to check if user has required role
export const hasRole = async (requiredRoles: string[]) => {
  const profile = await getCurrentUserProfile();
  return profile && requiredRoles.includes(profile.role);
};

// Helper function to log audit events
export const logAuditEvent = async (
  tableName: string,
  recordId: string,
  action: string,
  oldValues?: any,
  newValues?: any
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  const profile = await getCurrentUserProfile();
  
  const { error } = await supabase.rpc('log_audit_event', {
    p_user_id: user.id,
    p_organization_id: profile?.organization_id || null,
    p_table_name: tableName,
    p_record_id: recordId,
    p_action: action,
    p_old_values: oldValues ? JSON.stringify(oldValues) : null,
    p_new_values: newValues ? JSON.stringify(newValues) : null,
    p_ip_address: null, // Could be populated with actual IP if needed
    p_user_agent: navigator.userAgent
  });

  if (error) {
    console.error('Error logging audit event:', error);
  }
};