export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          document_id: string | null
          application_type: string
          form_data: Json
          extracted_data: Json
          status: 'pending' | 'processing' | 'completed' | 'rejected'
          submitted_at: string
          processed_at: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          document_id?: string | null
          application_type?: string
          form_data?: Json
          extracted_data?: Json
          status?: 'pending' | 'processing' | 'completed' | 'rejected'
          submitted_at?: string
          processed_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          document_id?: string | null
          application_type?: string
          form_data?: Json
          extracted_data?: Json
          status?: 'pending' | 'processing' | 'completed' | 'rejected'
          submitted_at?: string
          processed_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          organization_id: string | null
          table_name: string
          record_id: string | null
          action: string
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          table_name: string
          record_id?: string | null
          action: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          table_name?: string
          record_id?: string | null
          action?: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          filename: string
          original_filename: string
          file_path: string
          file_size: number
          mime_type: string
          document_type: 'passport' | 'id_card' | 'driver_license' | 'other'
          extracted_data: Json
          is_processed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          filename: string
          original_filename: string
          file_path: string
          file_size: number
          mime_type: string
          document_type?: 'passport' | 'id_card' | 'driver_license' | 'other'
          extracted_data?: Json
          is_processed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          filename?: string
          original_filename?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          document_type?: 'passport' | 'id_card' | 'driver_license' | 'other'
          extracted_data?: Json
          is_processed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          full_name: string | null
          role: 'superadmin' | 'admin' | 'user'
          avatar_url: string | null
          phone: string | null
          address: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          email: string
          full_name?: string | null
          role?: 'superadmin' | 'admin' | 'user'
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          full_name?: string | null
          role?: 'superadmin' | 'admin' | 'user'
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_full_name?: string
          user_role?: 'superadmin' | 'admin' | 'user'
          org_id?: string
        }
        Returns: string
      }
      log_audit_event: {
        Args: {
          p_user_id: string
          p_organization_id: string
          p_table_name: string
          p_record_id: string
          p_action: string
          p_old_values?: Json
          p_new_values?: Json
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: string
      }
    }
    Enums: {
      application_status: 'pending' | 'processing' | 'completed' | 'rejected'
      document_type: 'passport' | 'id_card' | 'driver_license' | 'other'
      user_role: 'superadmin' | 'admin' | 'user'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}