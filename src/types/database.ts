/**
 * Database Types
 * Generated from Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          role: 'student' | 'educator' | 'researcher' | 'admin'
          institution: string | null
          department: string | null
          research_interests: string[] | null
          preferences: Json
          notification_settings: Json
          total_structures: number
          total_annotations: number
          total_sessions: number
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          username: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          role?: 'student' | 'educator' | 'researcher' | 'admin'
          institution?: string | null
          department?: string | null
          research_interests?: string[] | null
          preferences?: Json
          notification_settings?: Json
          total_structures?: number
          total_annotations?: number
          total_sessions?: number
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          role?: 'student' | 'educator' | 'researcher' | 'admin'
          institution?: string | null
          department?: string | null
          research_interests?: string[] | null
          preferences?: Json
          notification_settings?: Json
          total_structures?: number
          total_annotations?: number
          total_sessions?: number
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'student' | 'educator' | 'researcher' | 'admin'
      structure_type: 'molecule' | 'protein' | 'dna' | 'rna' | 'complex'
      file_format: 'pdb' | 'xyz' | 'mol2' | 'sdf' | 'cif' | 'gro'
      simulation_status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
      simulation_type: 'md' | 'mc' | 'docking' | 'optimization' | 'visualization'
      content_type: 'video' | 'guide' | 'tutorial' | 'quiz' | 'pathway'
      visibility: 'private' | 'unlisted' | 'public' | 'institution'
      share_permission: 'view' | 'comment' | 'edit' | 'admin'
    }
  }
}
