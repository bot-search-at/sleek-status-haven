import type { Database as SupabaseDatabase } from "@/integrations/supabase/types";

// Extend the base Supabase database type
export interface Database extends SupabaseDatabase {
  public: {
    Tables: {
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
          service_group: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
          service_group: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
          service_group?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          title: string;
          status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          impact: 'none' | 'minor' | 'major' | 'critical';
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          service_ids: string[];
        };
        Insert: {
          id?: string;
          title: string;
          status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          impact: 'none' | 'minor' | 'major' | 'critical';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          service_ids: string[];
        };
        Update: {
          id?: string;
          title?: string;
          status?: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          impact?: 'none' | 'minor' | 'major' | 'critical';
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          service_ids?: string[];
        };
        Relationships: [];
      };
      incident_updates: {
        Row: {
          id: string;
          incident_id: string;
          status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          status?: 'investigating' | 'identified' | 'monitoring' | 'resolved';
          message?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incident_updates_incident_id_fkey";
            columns: ["incident_id"];
            isOneToOne: false;
            referencedRelation: "incidents";
            referencedColumns: ["id"];
          }
        ];
      };
      uptime_data: {
        Row: {
          id: string;
          date: string;
          uptime: number;
          services: Record<string, { uptime: number; incidents: string[] }>;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          uptime: number;
          services: Record<string, { uptime: number; incidents: string[] }>;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          uptime?: number;
          services?: Record<string, { uptime: number; incidents: string[] }>;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discord_bot_config: {
        Row: {
          id: number;
          token: string;
          guild_ids: string[];
          status_channel_id: string;
          enabled: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          design_theme: 'default' | 'minimal' | 'compact' | 'modern'; 
          color_scheme: 'standard' | 'dark' | 'light' | 'custom'; 
          commands: Array<{name: string, description: string, is_slash_command?: boolean}>;
          use_slash_commands: boolean | null;
        };
        Insert: {
          id: number; 
          token: string;
          guild_ids?: string[];
          status_channel_id: string;
          enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          design_theme?: 'default' | 'minimal' | 'compact' | 'modern';
          color_scheme?: 'standard' | 'dark' | 'light' | 'custom';
          commands?: Array<{name: string, description: string, is_slash_command?: boolean}>;
          use_slash_commands?: boolean | null;
        };
        Update: {
          id?: number;
          token?: string;
          guild_ids?: string[];
          status_channel_id?: string;
          enabled?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          design_theme?: 'default' | 'minimal' | 'compact' | 'modern';
          color_scheme?: 'standard' | 'dark' | 'light' | 'custom';
          commands?: Array<{name: string, description: string, is_slash_command?: boolean}>;
          use_slash_commands?: boolean | null;
        };
        Relationships: [];
      };
      discord_status_messages: {
        Row: {
          id: string;
          message_id: string;
          channel_id: string;
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          message_id: string;
          channel_id: string;
          content: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          message_id?: string;
          channel_id?: string;
          content?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
