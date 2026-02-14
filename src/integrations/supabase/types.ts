export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          decision_id: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          decision_id: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          decision_id?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      briefings: {
        Row: {
          content: Json
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: Json
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: Json
          generated_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          decision_id: string
          id: string
          type: Database["public"]["Enums"]["comment_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          decision_id: string
          id?: string
          type?: Database["public"]["Enums"]["comment_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          decision_id?: string
          id?: string
          type?: Database["public"]["Enums"]["comment_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_dependencies: {
        Row: {
          created_at: string
          created_by: string
          dependency_type: string
          id: string
          source_decision_id: string
          target_decision_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dependency_type?: string
          id?: string
          source_decision_id: string
          target_decision_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dependency_type?: string
          id?: string
          source_decision_id?: string
          target_decision_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_dependencies_source_decision_id_fkey"
            columns: ["source_decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_dependencies_target_decision_id_fkey"
            columns: ["target_decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_goal_links: {
        Row: {
          created_at: string
          decision_id: string
          goal_id: string
          id: string
          impact_weight: number | null
          linked_by: string
        }
        Insert: {
          created_at?: string
          decision_id: string
          goal_id: string
          id?: string
          impact_weight?: number | null
          linked_by: string
        }
        Update: {
          created_at?: string
          decision_id?: string
          goal_id?: string
          id?: string
          impact_weight?: number | null
          linked_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_goal_links_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_goal_links_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "strategic_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_reviews: {
        Row: {
          created_at: string
          decision_id: string
          feedback: string | null
          id: string
          reviewed_at: string | null
          reviewer_id: string
          status: Database["public"]["Enums"]["decision_status"]
          step_order: number
        }
        Insert: {
          created_at?: string
          decision_id: string
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id: string
          status?: Database["public"]["Enums"]["decision_status"]
          step_order?: number
        }
        Update: {
          created_at?: string
          decision_id?: string
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string
          status?: Database["public"]["Enums"]["decision_status"]
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "decision_reviews_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_scenarios: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          created_by: string
          decision_id: string
          description: string | null
          id: string
          impact: string | null
          outcome_if_negative: string | null
          outcome_if_positive: string | null
          probability: number | null
          title: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          created_by: string
          decision_id: string
          description?: string | null
          id?: string
          impact?: string | null
          outcome_if_negative?: string | null
          outcome_if_positive?: string | null
          probability?: number | null
          title: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          created_by?: string
          decision_id?: string
          description?: string | null
          id?: string
          impact?: string | null
          outcome_if_negative?: string | null
          outcome_if_positive?: string | null
          probability?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_scenarios_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          actual_impact_score: number | null
          ai_impact_score: number | null
          ai_options: Json | null
          ai_risk_factors: string[] | null
          ai_risk_score: number | null
          ai_success_factors: string[] | null
          assignee_id: string | null
          category: Database["public"]["Enums"]["decision_category"]
          context: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          escalation_level: number | null
          id: string
          implemented_at: string | null
          last_escalated_at: string | null
          options: Json | null
          outcome: string | null
          outcome_notes: string | null
          priority: Database["public"]["Enums"]["decision_priority"]
          status: Database["public"]["Enums"]["decision_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_impact_score?: number | null
          ai_impact_score?: number | null
          ai_options?: Json | null
          ai_risk_factors?: string[] | null
          ai_risk_score?: number | null
          ai_success_factors?: string[] | null
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["decision_category"]
          context?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          escalation_level?: number | null
          id?: string
          implemented_at?: string | null
          last_escalated_at?: string | null
          options?: Json | null
          outcome?: string | null
          outcome_notes?: string | null
          priority?: Database["public"]["Enums"]["decision_priority"]
          status?: Database["public"]["Enums"]["decision_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_impact_score?: number | null
          ai_impact_score?: number | null
          ai_options?: Json | null
          ai_risk_factors?: string[] | null
          ai_risk_score?: number | null
          ai_success_factors?: string[] | null
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["decision_category"]
          context?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          escalation_level?: number | null
          id?: string
          implemented_at?: string | null
          last_escalated_at?: string | null
          options?: Json | null
          outcome?: string | null
          outcome_notes?: string | null
          priority?: Database["public"]["Enums"]["decision_priority"]
          status?: Database["public"]["Enums"]["decision_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          decision_id: string | null
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decision_id?: string | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decision_id?: string | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stakeholder_positions: {
        Row: {
          concerns: string | null
          created_at: string
          decision_id: string
          id: string
          position: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concerns?: string | null
          created_at?: string
          decision_id: string
          id?: string
          position: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concerns?: string | null
          created_at?: string
          decision_id?: string
          id?: string
          position?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_positions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_goals: {
        Row: {
          created_at: string
          created_by: string
          current_value: number | null
          description: string | null
          due_date: string | null
          goal_type: string
          id: string
          owner_id: string | null
          quarter: string | null
          status: string
          target_value: number | null
          team_id: string | null
          title: string
          unit: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          goal_type?: string
          id?: string
          owner_id?: string | null
          quarter?: string | null
          status?: string
          target_value?: number | null
          team_id?: string | null
          title: string
          unit?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          goal_type?: string
          id?: string
          owner_id?: string | null
          quarter?: string | null
          status?: string
          target_value?: number | null
          team_id?: string | null
          title?: string
          unit?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string
          status: string
          team_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by: string
          status?: string
          team_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          hourly_rate: number | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_ai_settings: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          model: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          model?: string | null
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          model?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      comment_type: "comment" | "feedback" | "risk_flag"
      decision_category:
        | "strategic"
        | "budget"
        | "hr"
        | "technical"
        | "operational"
        | "marketing"
      decision_priority: "low" | "medium" | "high" | "critical"
      decision_status:
        | "draft"
        | "review"
        | "approved"
        | "implemented"
        | "rejected"
      user_role: "admin" | "decision_maker" | "reviewer" | "observer"
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
  public: {
    Enums: {
      comment_type: ["comment", "feedback", "risk_flag"],
      decision_category: [
        "strategic",
        "budget",
        "hr",
        "technical",
        "operational",
        "marketing",
      ],
      decision_priority: ["low", "medium", "high", "critical"],
      decision_status: [
        "draft",
        "review",
        "approved",
        "implemented",
        "rejected",
      ],
      user_role: ["admin", "decision_maker", "reviewer", "observer"],
    },
  },
} as const
