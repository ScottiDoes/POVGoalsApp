export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artifacts_consultant: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string
          storage_path: string
          use_case_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          storage_path: string
          use_case_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          storage_path?: string
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_consultant_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases_consultant"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts_org: {
        Row: {
          created_at: string
          file_name: string
          id: string
          mime_type: string
          storage_path: string
          use_case_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          storage_path: string
          use_case_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          storage_path?: string
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_org_use_case_id_fkey"
            columns: ["use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases_org"
            referencedColumns: ["id"]
          },
        ]
      }
      component_artifacts: {
        Row: {
          component_name: string
          created_at: string
          id: string
          note: string | null
          prospect_id: string | null
          session_id: string
          storage_path: string
          use_case_id: string
        }
        Insert: {
          component_name: string
          created_at?: string
          id?: string
          note?: string | null
          prospect_id?: string | null
          session_id: string
          storage_path: string
          use_case_id: string
        }
        Update: {
          component_name?: string
          created_at?: string
          id?: string
          note?: string | null
          prospect_id?: string | null
          session_id?: string
          storage_path?: string
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "component_artifacts_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "pov_prospects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_artifacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "meeting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_sessions: {
        Row: {
          component_importance: Json
          consultant_id: string
          created_at: string
          id: string
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          next_step: Database["public"]["Enums"]["next_step_type"] | null
          next_step_other: string | null
          notes: string | null
          prospect_company: string | null
          prospect_id: string | null
          prospect_name: string | null
          resonated_use_case_ids: string[]
          status: string
        }
        Insert: {
          component_importance?: Json
          consultant_id: string
          created_at?: string
          id?: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          next_step?: Database["public"]["Enums"]["next_step_type"] | null
          next_step_other?: string | null
          notes?: string | null
          prospect_company?: string | null
          prospect_id?: string | null
          prospect_name?: string | null
          resonated_use_case_ids?: string[]
          status?: string
        }
        Update: {
          component_importance?: Json
          consultant_id?: string
          created_at?: string
          id?: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          next_step?: Database["public"]["Enums"]["next_step_type"] | null
          next_step_other?: string | null
          notes?: string | null
          prospect_company?: string | null
          prospect_id?: string | null
          prospect_name?: string | null
          resonated_use_case_ids?: string[]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_sessions_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_sessions_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "pov_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      pov_goals: {
        Row: {
          consultant_id: string
          created_at: string
          id: string
          linked_use_case_ids: string[]
          status: Database["public"]["Enums"]["goal_status"]
          success_metric: string
          title: string
          updated_at: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          id?: string
          linked_use_case_ids?: string[]
          status?: Database["public"]["Enums"]["goal_status"]
          success_metric: string
          title: string
          updated_at?: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          id?: string
          linked_use_case_ids?: string[]
          status?: Database["public"]["Enums"]["goal_status"]
          success_metric?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pov_goals_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pov_prospects: {
        Row: {
          component_statuses: Json
          consultant_id: string
          contact_name: string | null
          created_at: string
          end_date: string | null
          id: string
          kickoff_date: string | null
          linked_use_case_ids: string[]
          main_goals: string | null
          org_name: string
          updated_at: string
          use_case_snapshot: Json
        }
        Insert: {
          component_statuses?: Json
          consultant_id: string
          contact_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          kickoff_date?: string | null
          linked_use_case_ids?: string[]
          main_goals?: string | null
          org_name: string
          updated_at?: string
          use_case_snapshot?: Json
        }
        Update: {
          component_statuses?: Json
          consultant_id?: string
          contact_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          kickoff_date?: string | null
          linked_use_case_ids?: string[]
          main_goals?: string | null
          org_name?: string
          updated_at?: string
          use_case_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pov_prospects_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      use_cases_consultant: {
        Row: {
          after_text: string
          before_text: string
          components: string[]
          consultant_id: string
          created_at: string
          id: string
          is_hidden: boolean
          org_use_case_id: string | null
          pain_point_tag: string
          roi_description: string
          roi_stat: string
          title: string
          updated_at: string
        }
        Insert: {
          after_text: string
          before_text: string
          components?: string[]
          consultant_id: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          org_use_case_id?: string | null
          pain_point_tag: string
          roi_description: string
          roi_stat: string
          title?: string
          updated_at?: string
        }
        Update: {
          after_text?: string
          before_text?: string
          components?: string[]
          consultant_id?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          org_use_case_id?: string | null
          pain_point_tag?: string
          roi_description?: string
          roi_stat?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "use_cases_consultant_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "use_cases_consultant_org_use_case_id_fkey"
            columns: ["org_use_case_id"]
            isOneToOne: false
            referencedRelation: "use_cases_org"
            referencedColumns: ["id"]
          },
        ]
      }
      use_cases_org: {
        Row: {
          after_text: string
          before_text: string
          created_at: string
          created_by: string | null
          id: string
          pain_point_tag: string
          roi_description: string
          roi_stat: string
          updated_at: string
        }
        Insert: {
          after_text: string
          before_text: string
          created_at?: string
          created_by?: string | null
          id?: string
          pain_point_tag: string
          roi_description: string
          roi_stat: string
          updated_at?: string
        }
        Update: {
          after_text?: string
          before_text?: string
          created_at?: string
          created_by?: string | null
          id?: string
          pain_point_tag?: string
          roi_description?: string
          roi_stat?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "use_cases_org_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      component_status:
        | "not_started"
        | "in_progress"
        | "demo_approved"
        | "complete"
        | "disregarded"
      goal_status: "not_started" | "in_progress" | "achieved"
      meeting_type: "kickoff" | "continuation"
      next_step_type:
        | "technical_deep_dive"
        | "pilot_scoping"
        | "stakeholder_review"
        | "send_materials"
        | "other"
      user_role: "admin" | "consultant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      component_status: [
        "not_started",
        "in_progress",
        "demo_approved",
        "complete",
        "disregarded",
      ],
      goal_status: ["not_started", "in_progress", "achieved"],
      meeting_type: ["kickoff", "continuation"],
      next_step_type: [
        "technical_deep_dive",
        "pilot_scoping",
        "stakeholder_review",
        "send_materials",
        "other",
      ],
      user_role: ["admin", "consultant"],
    },
  },
} as const

