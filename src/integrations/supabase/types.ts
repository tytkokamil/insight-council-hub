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
      active_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          ip_address: string | null
          is_current: boolean
          last_active_at: string
          revoked: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          revoked?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          revoked?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          change_reason: string | null
          created_at: string
          decision_id: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          org_id: string | null
          signature_method: string | null
          signed_at: string | null
          signed_by: string | null
          user_id: string
        }
        Insert: {
          action: string
          change_reason?: string | null
          created_at?: string
          decision_id: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          org_id?: string | null
          signature_method?: string | null
          signed_at?: string | null
          signed_by?: string | null
          user_id: string
        }
        Update: {
          action?: string
          change_reason?: string | null
          created_at?: string
          decision_id?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          org_id?: string | null
          signature_method?: string | null
          signed_at?: string | null
          signed_by?: string | null
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
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      automation_rule_logs: {
        Row: {
          action_taken: string
          decision_id: string
          details: string | null
          executed_at: string
          id: string
          rule_id: string
        }
        Insert: {
          action_taken: string
          decision_id: string
          details?: string | null
          executed_at?: string
          id?: string
          rule_id: string
        }
        Update: {
          action_taken?: string
          decision_id?: string
          details?: string | null
          executed_at?: string
          id?: string
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_logs_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rule_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_type: string
          action_value: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at: string
          created_by: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          org_id: string | null
          team_id: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          action_type: string
          action_value: string
          condition_field: string
          condition_operator?: string
          condition_value: string
          created_at?: string
          created_by: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          org_id?: string | null
          team_id?: string | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          action_value?: string
          condition_field?: string
          condition_operator?: string
          condition_value?: string
          created_at?: string
          created_by?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          org_id?: string | null
          team_id?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
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
      data_retention_config: {
        Row: {
          auto_archive_days: number
          auto_delete_archived_days: number | null
          enabled: boolean
          id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          auto_archive_days?: number
          auto_delete_archived_days?: number | null
          enabled?: boolean
          id?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          auto_archive_days?: number
          auto_delete_archived_days?: number | null
          enabled?: boolean
          id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      decision_dependencies: {
        Row: {
          created_at: string
          created_by: string
          dependency_type: string
          id: string
          source_decision_id: string | null
          source_task_id: string | null
          target_decision_id: string | null
          target_task_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          dependency_type?: string
          id?: string
          source_decision_id?: string | null
          source_task_id?: string | null
          target_decision_id?: string | null
          target_task_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          dependency_type?: string
          id?: string
          source_decision_id?: string | null
          source_task_id?: string | null
          target_decision_id?: string | null
          target_task_id?: string | null
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
            foreignKeyName: "decision_dependencies_source_task_id_fkey"
            columns: ["source_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_dependencies_target_decision_id_fkey"
            columns: ["target_decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_dependencies_target_task_id_fkey"
            columns: ["target_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      decision_shares: {
        Row: {
          decision_id: string
          expires_at: string | null
          id: string
          permission: Database["public"]["Enums"]["share_permission"]
          shared_at: string
          shared_by: string
          team_id: string
        }
        Insert: {
          decision_id: string
          expires_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["share_permission"]
          shared_at?: string
          shared_by: string
          team_id: string
        }
        Update: {
          decision_id?: string
          expires_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["share_permission"]
          shared_at?: string
          shared_by?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_shares_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_shares_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_tags: {
        Row: {
          created_at: string
          created_by: string
          decision_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          decision_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          decision_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_tags_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_templates: {
        Row: {
          approval_steps: Json
          category: string
          conditional_rules: Json
          created_at: string
          created_by: string
          default_duration_days: number
          description: string
          governance_notes: string | null
          icon_color: string | null
          id: string
          industry: string | null
          is_system: boolean
          name: string
          org_id: string | null
          priority: string
          required_fields: Json
          slug: string
          updated_at: string
          version: number
          when_to_use: string | null
        }
        Insert: {
          approval_steps?: Json
          category?: string
          conditional_rules?: Json
          created_at?: string
          created_by: string
          default_duration_days?: number
          description?: string
          governance_notes?: string | null
          icon_color?: string | null
          id?: string
          industry?: string | null
          is_system?: boolean
          name: string
          org_id?: string | null
          priority?: string
          required_fields?: Json
          slug: string
          updated_at?: string
          version?: number
          when_to_use?: string | null
        }
        Update: {
          approval_steps?: Json
          category?: string
          conditional_rules?: Json
          created_at?: string
          created_by?: string
          default_duration_days?: number
          description?: string
          governance_notes?: string | null
          icon_color?: string | null
          id?: string
          industry?: string | null
          is_system?: boolean
          name?: string
          org_id?: string | null
          priority?: string
          required_fields?: Json
          slug?: string
          updated_at?: string
          version?: number
          when_to_use?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_versions: {
        Row: {
          change_reason: string | null
          created_at: string
          created_by: string
          decision_id: string
          id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          created_by: string
          decision_id: string
          id?: string
          snapshot: Json
          version_number?: number
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          created_by?: string
          decision_id?: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "decision_versions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_votes: {
        Row: {
          comment: string | null
          created_at: string
          decision_id: string
          id: string
          session_id: string | null
          user_id: string
          vote: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          decision_id: string
          id?: string
          session_id?: string | null
          user_id: string
          vote: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          decision_id?: string
          id?: string
          session_id?: string | null
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_votes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_watchlist: {
        Row: {
          created_at: string
          decision_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decision_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decision_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_watchlist_decision_id_fkey"
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
          ai_analysis_cache: Json | null
          ai_impact_score: number | null
          ai_options: Json | null
          ai_risk_factors: string[] | null
          ai_risk_score: number | null
          ai_success_factors: string[] | null
          archived_at: string | null
          assignee_id: string | null
          cancelled_at: string | null
          category: Database["public"]["Enums"]["decision_category"]
          confidential: boolean
          context: string | null
          cost_per_day: number | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          escalation_level: number | null
          health_score: number | null
          id: string
          implemented_at: string | null
          last_escalated_at: string | null
          options: Json | null
          org_id: string | null
          outcome: string | null
          outcome_notes: string | null
          outcome_type: Database["public"]["Enums"]["outcome_type"] | null
          owner_id: string
          priority: Database["public"]["Enums"]["decision_priority"]
          status: Database["public"]["Enums"]["decision_status"]
          superseded_by: string | null
          team_id: string | null
          template_snapshot: Json | null
          template_used: string | null
          template_version: number | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_impact_score?: number | null
          ai_analysis_cache?: Json | null
          ai_impact_score?: number | null
          ai_options?: Json | null
          ai_risk_factors?: string[] | null
          ai_risk_score?: number | null
          ai_success_factors?: string[] | null
          archived_at?: string | null
          assignee_id?: string | null
          cancelled_at?: string | null
          category?: Database["public"]["Enums"]["decision_category"]
          confidential?: boolean
          context?: string | null
          cost_per_day?: number | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          escalation_level?: number | null
          health_score?: number | null
          id?: string
          implemented_at?: string | null
          last_escalated_at?: string | null
          options?: Json | null
          org_id?: string | null
          outcome?: string | null
          outcome_notes?: string | null
          outcome_type?: Database["public"]["Enums"]["outcome_type"] | null
          owner_id: string
          priority?: Database["public"]["Enums"]["decision_priority"]
          status?: Database["public"]["Enums"]["decision_status"]
          superseded_by?: string | null
          team_id?: string | null
          template_snapshot?: Json | null
          template_used?: string | null
          template_version?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_impact_score?: number | null
          ai_analysis_cache?: Json | null
          ai_impact_score?: number | null
          ai_options?: Json | null
          ai_risk_factors?: string[] | null
          ai_risk_score?: number | null
          ai_success_factors?: string[] | null
          archived_at?: string | null
          assignee_id?: string | null
          cancelled_at?: string | null
          category?: Database["public"]["Enums"]["decision_category"]
          confidential?: boolean
          context?: string | null
          cost_per_day?: number | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          escalation_level?: number | null
          health_score?: number | null
          id?: string
          implemented_at?: string | null
          last_escalated_at?: string | null
          options?: Json | null
          org_id?: string | null
          outcome?: string | null
          outcome_notes?: string | null
          outcome_type?: Database["public"]["Enums"]["outcome_type"] | null
          owner_id?: string
          priority?: Database["public"]["Enums"]["decision_priority"]
          status?: Database["public"]["Enums"]["decision_status"]
          superseded_by?: string | null
          team_id?: string | null
          template_snapshot?: Json | null
          template_used?: string | null
          template_version?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_config: {
        Row: {
          category: string
          config_key: string
          config_value: number
          created_at: string
          description: string | null
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          category?: string
          config_key: string
          config_value: number
          created_at?: string
          description?: string | null
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          category?: string
          config_key?: string
          config_value?: number
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string
          description: string | null
          enabled: boolean
          feature_key: string
          id: string
          label: string
          min_plan: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          feature_key: string
          id?: string
          label: string
          min_plan?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          feature_key?: string
          id?: string
          label?: string
          min_plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      gamification_scores: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          level: string
          longest_streak: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: string
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: string
          longest_streak?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kpi_definitions: {
        Row: {
          adaptive: boolean
          calculation_key: string
          category: string
          created_at: string
          default_threshold_critical: number | null
          default_threshold_good: number | null
          default_threshold_warning: number | null
          description: string | null
          id: string
          kpi_key: string
          label: string
          positive_direction: string
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          adaptive?: boolean
          calculation_key: string
          category?: string
          created_at?: string
          default_threshold_critical?: number | null
          default_threshold_good?: number | null
          default_threshold_warning?: number | null
          description?: string | null
          id?: string
          kpi_key: string
          label: string
          positive_direction?: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          adaptive?: boolean
          calculation_key?: string
          category?: string
          created_at?: string
          default_threshold_critical?: number | null
          default_threshold_good?: number | null
          default_threshold_warning?: number | null
          description?: string | null
          id?: string
          kpi_key?: string
          label?: string
          positive_direction?: string
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons_learned: {
        Row: {
          created_at: string
          created_by: string
          decision_id: string
          id: string
          key_takeaway: string
          recommendations: string | null
          updated_at: string
          what_went_well: string | null
          what_went_wrong: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          decision_id: string
          id?: string
          key_takeaway: string
          recommendations?: string | null
          updated_at?: string
          what_went_well?: string | null
          what_went_wrong?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          decision_id?: string
          id?: string
          key_takeaway?: string
          recommendations?: string | null
          updated_at?: string
          what_went_well?: string | null
          what_went_wrong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_learned_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_sessions: {
        Row: {
          created_at: string
          created_by: string
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          status: string
          team_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          team_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          team_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_sessions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          email_otp_enabled: boolean
          id: string
          preferred_method: string
          totp_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          email_otp_enabled?: boolean
          id?: string
          preferred_method?: string
          totp_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          email_otp_enabled?: boolean
          id?: string
          preferred_method?: string
          totp_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          deadline_enabled: boolean
          digest_frequency: string
          escalations: boolean
          gamification_enabled: boolean
          id: string
          mention_enabled: boolean
          review_requests: boolean
          status_change_enabled: boolean
          team_updates: boolean
          updated_at: string
          user_id: string
          watchlist_enabled: boolean
        }
        Insert: {
          created_at?: string
          deadline_enabled?: boolean
          digest_frequency?: string
          escalations?: boolean
          gamification_enabled?: boolean
          id?: string
          mention_enabled?: boolean
          review_requests?: boolean
          status_change_enabled?: boolean
          team_updates?: boolean
          updated_at?: string
          user_id: string
          watchlist_enabled?: boolean
        }
        Update: {
          created_at?: string
          deadline_enabled?: boolean
          digest_frequency?: string
          escalations?: boolean
          gamification_enabled?: boolean
          id?: string
          mention_enabled?: boolean
          review_requests?: boolean
          status_change_enabled?: boolean
          team_updates?: boolean
          updated_at?: string
          user_id?: string
          watchlist_enabled?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          decision_id: string | null
          id: string
          message: string | null
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_kpi_config: {
        Row: {
          benchmark_mode: string
          created_at: string
          custom_threshold_critical: number | null
          custom_threshold_good: number | null
          custom_threshold_warning: number | null
          custom_weight: number
          enabled: boolean
          id: string
          kpi_id: string
          updated_at: string
        }
        Insert: {
          benchmark_mode?: string
          created_at?: string
          custom_threshold_critical?: number | null
          custom_threshold_good?: number | null
          custom_threshold_warning?: number | null
          custom_weight?: number
          enabled?: boolean
          id?: string
          kpi_id: string
          updated_at?: string
        }
        Update: {
          benchmark_mode?: string
          created_at?: string
          custom_threshold_critical?: number | null
          custom_threshold_good?: number | null
          custom_threshold_warning?: number | null
          custom_weight?: number
          enabled?: boolean
          id?: string
          kpi_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_kpi_config_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: true
            referencedRelation: "kpi_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: string
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: string
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: string
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          decision_count: number | null
          full_name: string | null
          id: string
          industry: string | null
          org_id: string | null
          progressive_override: boolean | null
          updated_at: string
          user_id: string
          view_mode: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          decision_count?: number | null
          full_name?: string | null
          id?: string
          industry?: string | null
          org_id?: string | null
          progressive_override?: boolean | null
          updated_at?: string
          user_id: string
          view_mode?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          decision_count?: number | null
          full_name?: string | null
          id?: string
          industry?: string | null
          org_id?: string | null
          progressive_override?: boolean | null
          updated_at?: string
          user_id?: string
          view_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      review_delegations: {
        Row: {
          active: boolean
          created_at: string
          delegate_id: string
          delegator_id: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          delegate_id: string
          delegator_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          delegate_id?: string
          delegator_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      risk_decision_links: {
        Row: {
          created_at: string
          decision_id: string
          id: string
          linked_by: string
          risk_id: string
        }
        Insert: {
          created_at?: string
          decision_id: string
          id?: string
          linked_by: string
          risk_id: string
        }
        Update: {
          created_at?: string
          decision_id?: string
          id?: string
          linked_by?: string
          risk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_decision_links_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_decision_links_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "risks"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_task_links: {
        Row: {
          created_at: string
          id: string
          linked_by: string
          risk_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_by: string
          risk_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_by?: string
          risk_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_task_links_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "risks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_task_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          impact: number
          likelihood: number
          mitigation_plan: string | null
          org_id: string | null
          owner_id: string | null
          risk_score: number | null
          status: string
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          impact?: number
          likelihood?: number
          mitigation_plan?: string | null
          org_id?: string | null
          owner_id?: string | null
          risk_score?: number | null
          status?: string
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          impact?: number
          likelihood?: number
          mitigation_plan?: string | null
          org_id?: string | null
          owner_id?: string | null
          risk_score?: number | null
          status?: string
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          org_id: string | null
          permission: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          org_id?: string | null
          permission: string
          role: Database["public"]["Enums"]["org_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          org_id?: string | null
          permission?: string
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          created_at: string
          entity_type: string
          filters: Json
          icon: string | null
          id: string
          is_pinned: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_type?: string
          filters?: Json
          icon?: string | null
          id?: string
          is_pinned?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          filters?: Json
          icon?: string | null
          id?: string
          is_pinned?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sla_configs: {
        Row: {
          category: string
          created_at: string
          escalation_hours_overdue: number
          escalation_hours_urgent: number
          escalation_hours_warn: number
          id: string
          priority: string
          reassign_days: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          escalation_hours_overdue?: number
          escalation_hours_urgent?: number
          escalation_hours_warn?: number
          id?: string
          priority: string
          reassign_days?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          escalation_hours_overdue?: number
          escalation_hours_urgent?: number
          escalation_hours_warn?: number
          id?: string
          priority?: string
          reassign_days?: number
          updated_at?: string
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
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
            foreignKeyName: "strategic_goals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategic_goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          category: Database["public"]["Enums"]["task_category"]
          completed_at: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          org_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          completed_at?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_chat_reads: {
        Row: {
          id: string
          last_read_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_read_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_read_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_chat_reads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_defaults: {
        Row: {
          created_at: string
          default_category: string
          default_priority: string
          default_review_flow: string
          default_sla_days: number
          id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_category?: string
          default_priority?: string
          default_review_flow?: string
          default_sla_days?: number
          id?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_category?: string
          default_priority?: string
          default_review_flow?: string
          default_sla_days?: number
          id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_defaults_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
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
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
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
      team_messages: {
        Row: {
          content: string
          created_at: string
          decision_id: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          decision_id?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          decision_id?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          cod_overhead_factor: number
          cod_persons: number
          created_at: string
          created_by: string | null
          description: string | null
          hourly_rate: number | null
          id: string
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          cod_overhead_factor?: number
          cod_persons?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          cod_overhead_factor?: number
          cod_persons?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      terminology: {
        Row: {
          created_at: string
          custom_term: string
          default_term: string
          id: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_term: string
          default_term: string
          id?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_term?: string
          default_term?: string
          id?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminology_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      user_badges: {
        Row: {
          badge_key: string
          badge_label: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_key: string
          badge_label: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          badge_label?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_delegate: { Args: { _user_id: string }; Returns: string }
      get_dashboard_kpis: {
        Args: { _team_id?: string; _user_id: string }
        Returns: Json
      }
      get_org_role: { Args: { _user_id: string }; Returns: string }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_min_role: {
        Args: { _min_role: string; _user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["org_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_team_role: {
        Args: {
          _role: Database["public"]["Enums"]["team_role"]
          _team_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      is_team_lead_or_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      transfer_ownership: {
        Args: { _current_owner_id: string; _new_owner_id: string }
        Returns: undefined
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
        | "proposed"
        | "review"
        | "approved"
        | "implemented"
        | "rejected"
        | "archived"
        | "cancelled"
        | "superseded"
        | "open"
        | "in_review"
        | "implementing"
      event_type:
        | "decision.created"
        | "decision.updated"
        | "decision.status_changed"
        | "decision.deleted"
        | "decision.restored"
        | "decision.archived"
        | "decision.shared"
        | "decision.template_upgraded"
        | "review.created"
        | "review.approved"
        | "review.rejected"
        | "review.delegated"
        | "task.created"
        | "task.updated"
        | "task.status_changed"
        | "task.deleted"
        | "task.restored"
        | "escalation.triggered"
        | "escalation.resolved"
        | "automation.rule_executed"
        | "team.member_added"
        | "team.member_removed"
        | "team.created"
        | "risk.created"
        | "risk.updated"
        | "risk.linked"
        | "comment.created"
        | "stakeholder.position_changed"
        | "goal.linked"
        | "goal.unlinked"
      org_role:
        | "org_owner"
        | "org_admin"
        | "org_member"
        | "org_executive"
        | "org_lead"
        | "org_viewer"
      outcome_type: "successful" | "partial" | "failed"
      share_permission: "read" | "comment" | "edit"
      task_category:
        | "general"
        | "strategic"
        | "operational"
        | "technical"
        | "hr"
        | "marketing"
        | "budget"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "backlog" | "open" | "in_progress" | "blocked" | "done"
      team_role: "lead" | "member" | "viewer" | "admin"
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
        "proposed",
        "review",
        "approved",
        "implemented",
        "rejected",
        "archived",
        "cancelled",
        "superseded",
        "open",
        "in_review",
        "implementing",
      ],
      event_type: [
        "decision.created",
        "decision.updated",
        "decision.status_changed",
        "decision.deleted",
        "decision.restored",
        "decision.archived",
        "decision.shared",
        "decision.template_upgraded",
        "review.created",
        "review.approved",
        "review.rejected",
        "review.delegated",
        "task.created",
        "task.updated",
        "task.status_changed",
        "task.deleted",
        "task.restored",
        "escalation.triggered",
        "escalation.resolved",
        "automation.rule_executed",
        "team.member_added",
        "team.member_removed",
        "team.created",
        "risk.created",
        "risk.updated",
        "risk.linked",
        "comment.created",
        "stakeholder.position_changed",
        "goal.linked",
        "goal.unlinked",
      ],
      org_role: [
        "org_owner",
        "org_admin",
        "org_member",
        "org_executive",
        "org_lead",
        "org_viewer",
      ],
      outcome_type: ["successful", "partial", "failed"],
      share_permission: ["read", "comment", "edit"],
      task_category: [
        "general",
        "strategic",
        "operational",
        "technical",
        "hr",
        "marketing",
        "budget",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: ["backlog", "open", "in_progress", "blocked", "done"],
      team_role: ["lead", "member", "viewer", "admin"],
    },
  },
} as const
