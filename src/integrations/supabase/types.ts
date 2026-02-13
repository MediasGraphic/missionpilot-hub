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
          entity_id: string | null
          entity_type: string
          id: string
          metadata_json: Json | null
          project_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata_json?: Json | null
          project_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata_json?: Json | null
          project_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      change_impacts: {
        Row: {
          change_request_id: string
          description: string | null
          id: string
          impact_type: Database["public"]["Enums"]["impact_type"]
          severity: Database["public"]["Enums"]["severity_level"]
        }
        Insert: {
          change_request_id: string
          description?: string | null
          id?: string
          impact_type: Database["public"]["Enums"]["impact_type"]
          severity?: Database["public"]["Enums"]["severity_level"]
        }
        Update: {
          change_request_id?: string
          description?: string | null
          id?: string
          impact_type?: Database["public"]["Enums"]["impact_type"]
          severity?: Database["public"]["Enums"]["severity_level"]
        }
        Relationships: [
          {
            foreignKeyName: "change_impacts_change_request_id_fkey"
            columns: ["change_request_id"]
            isOneToOne: false
            referencedRelation: "change_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          project_id: string
          source: string | null
          status: Database["public"]["Enums"]["change_request_status"]
          title: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          project_id: string
          source?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          title: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          project_id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      constraint_rules: {
        Row: {
          id: string
          name: string
          project_id: string
          rule_json: Json
          rule_type: Database["public"]["Enums"]["constraint_rule_type"]
        }
        Insert: {
          id?: string
          name: string
          project_id: string
          rule_json?: Json
          rule_type: Database["public"]["Enums"]["constraint_rule_type"]
        }
        Update: {
          id?: string
          name?: string
          project_id?: string
          rule_json?: Json
          rule_type?: Database["public"]["Enums"]["constraint_rule_type"]
        }
        Relationships: [
          {
            foreignKeyName: "constraint_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          due_date: string | null
          format: string | null
          id: string
          link_to_requirement_id: string | null
          lot_id: string | null
          name: string
          owner_user_id: string | null
          phase_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["deliverable_status"]
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          format?: string | null
          id?: string
          link_to_requirement_id?: string | null
          lot_id?: string | null
          name: string
          owner_user_id?: string | null
          phase_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["deliverable_status"]
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          format?: string | null
          id?: string
          link_to_requirement_id?: string | null
          lot_id?: string | null
          name?: string
          owner_user_id?: string | null
          phase_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["deliverable_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_link_to_requirement_id_fkey"
            columns: ["link_to_requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_url: string | null
          folder: string | null
          id: string
          project_id: string
          source_type: Database["public"]["Enums"]["source_type"]
          tags_json: Json | null
          title: string
          type: string | null
          uploaded_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_url?: string | null
          folder?: string | null
          id?: string
          project_id: string
          source_type?: Database["public"]["Enums"]["source_type"]
          tags_json?: Json | null
          title: string
          type?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_url?: string | null
          folder?: string | null
          id?: string
          project_id?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          tags_json?: Json | null
          title?: string
          type?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          created_at: string
          data_source: string | null
          definition: string | null
          deleted_at: string | null
          formula: string | null
          frequency: string | null
          id: string
          name: string
          owner_user_id: string | null
          project_id: string
          target: number | null
        }
        Insert: {
          created_at?: string
          data_source?: string | null
          definition?: string | null
          deleted_at?: string | null
          formula?: string | null
          frequency?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          project_id: string
          target?: number | null
        }
        Update: {
          created_at?: string
          data_source?: string | null
          definition?: string | null
          deleted_at?: string | null
          formula?: string | null
          frequency?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
          project_id?: string
          target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          project_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number
          project_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      module_toggles: {
        Row: {
          enabled: boolean
          id: string
          module_key: Database["public"]["Enums"]["module_key"]
          project_id: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          module_key: Database["public"]["Enums"]["module_key"]
          project_id: string
        }
        Update: {
          enabled?: boolean
          id?: string
          module_key?: Database["public"]["Enums"]["module_key"]
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_toggles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          created_at: string
          deleted_at: string | null
          end_date: string | null
          id: string
          lot_id: string | null
          name: string
          order_index: number
          project_id: string
          start_date: string | null
          template_key: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          lot_id?: string | null
          name: string
          order_index?: number
          project_id: string
          start_date?: string | null
          template_key?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          lot_id?: string | null
          name?: string
          order_index?: number
          project_id?: string
          start_date?: string | null
          template_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phases_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          domain: string | null
          end_date: string | null
          id: string
          name: string
          settings_json: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          client?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain?: string | null
          end_date?: string | null
          id?: string
          name: string
          settings_json?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          client?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          domain?: string | null
          end_date?: string | null
          id?: string
          name?: string
          settings_json?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      questionnaire_responses: {
        Row: {
          answers_json: Json
          completion_rate: number
          created_at: string
          device_hash: string | null
          id: string
          questionnaire_id: string
          respondent_email: string | null
          share_id: string | null
        }
        Insert: {
          answers_json?: Json
          completion_rate?: number
          created_at?: string
          device_hash?: string | null
          id?: string
          questionnaire_id: string
          respondent_email?: string | null
          share_id?: string | null
        }
        Update: {
          answers_json?: Json
          completion_rate?: number
          created_at?: string
          device_hash?: string | null
          id?: string
          questionnaire_id?: string
          respondent_email?: string | null
          share_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questionnaire_responses_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_shares: {
        Row: {
          access_mode: string
          created_at: string
          ends_at: string | null
          id: string
          max_responses: number | null
          one_per_device: boolean
          pin_code: string | null
          questionnaire_id: string
          share_type: string
          starts_at: string | null
          token: string
        }
        Insert: {
          access_mode?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          max_responses?: number | null
          one_per_device?: boolean
          pin_code?: string | null
          questionnaire_id: string
          share_type?: string
          starts_at?: string | null
          token?: string
        }
        Update: {
          access_mode?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          max_responses?: number | null
          one_per_device?: boolean
          pin_code?: string | null
          questionnaire_id?: string
          share_type?: string
          starts_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_shares_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          access_mode: string
          collect_identity: boolean
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          project_id: string | null
          questions_json: Json
          sections_json: Json
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          access_mode?: string
          collect_identity?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          questions_json?: Json
          sections_json?: Json
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          access_mode?: string
          collect_identity?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          questions_json?: Json
          sections_json?: Json
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "questionnaires_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          acceptance_criteria: string | null
          category: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          due_constraint_date: string | null
          extracted_by: Database["public"]["Enums"]["extracted_by"]
          id: string
          priority: string | null
          project_id: string
          source_document_id: string | null
          title: string
        }
        Insert: {
          acceptance_criteria?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_constraint_date?: string | null
          extracted_by?: Database["public"]["Enums"]["extracted_by"]
          id?: string
          priority?: string | null
          project_id: string
          source_document_id?: string | null
          title: string
        }
        Update: {
          acceptance_criteria?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          due_constraint_date?: string | null
          extracted_by?: Database["public"]["Enums"]["extracted_by"]
          id?: string
          priority?: string | null
          project_id?: string
          source_document_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          end_date: string
          id: string
          item_type: Database["public"]["Enums"]["schedule_item_type"]
          ref_id: string
          schedule_version_id: string
          start_date: string
        }
        Insert: {
          end_date: string
          id?: string
          item_type: Database["public"]["Enums"]["schedule_item_type"]
          ref_id: string
          schedule_version_id: string
          start_date: string
        }
        Update: {
          end_date?: string
          id?: string
          item_type?: Database["public"]["Enums"]["schedule_item_type"]
          ref_id?: string
          schedule_version_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_schedule_version_id_fkey"
            columns: ["schedule_version_id"]
            isOneToOne: false
            referencedRelation: "schedule_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          reason: string | null
          version_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          reason?: string | null
          version_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          reason?: string | null
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      share_invites: {
        Row: {
          created_at: string
          email: string
          id: string
          share_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          share_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_invites_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          influence_level: number | null
          interest_level: number | null
          name: string
          notes: string | null
          org: string | null
          phone: string | null
          project_id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          influence_level?: number | null
          interest_level?: number | null
          name: string
          notes?: string | null
          org?: string | null
          phone?: string | null
          project_id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          influence_level?: number | null
          interest_level?: number | null
          name?: string
          notes?: string | null
          org?: string | null
          phone?: string | null
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to_user_id: string | null
          created_at: string
          deleted_at: string | null
          deliverable_id: string | null
          dependencies_json: Json | null
          description: string | null
          duration_days: number | null
          effort_points: number | null
          end_date: string | null
          id: string
          name: string
          phase_id: string
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
        }
        Insert: {
          assigned_to_user_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deliverable_id?: string | null
          dependencies_json?: Json | null
          description?: string | null
          duration_days?: number | null
          effort_points?: number | null
          end_date?: string | null
          id?: string
          name: string
          phase_id: string
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
        }
        Update: {
          assigned_to_user_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deliverable_id?: string | null
          dependencies_json?: Json | null
          description?: string | null
          duration_days?: number | null
          effort_points?: number | null
          end_date?: string | null
          id?: string
          name?: string
          phase_id?: string
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      change_request_status: "proposé" | "validé" | "rejeté"
      constraint_rule_type:
        | "date_fixed"
        | "dependency"
        | "min_duration"
        | "max_duration"
        | "must_follow"
        | "resource_limit"
      deliverable_status:
        | "à_venir"
        | "en_cours"
        | "en_revue"
        | "validé"
        | "en_retard"
      extracted_by: "IA" | "Humain"
      impact_type: "délai" | "coût" | "ressource" | "livrable" | "risque"
      module_key:
        | "planning"
        | "documents"
        | "concertation"
        | "questionnaires"
        | "contributions"
        | "dashboards"
        | "livrables"
      project_status: "brouillon" | "actif" | "en_pause" | "terminé" | "archivé"
      schedule_item_type: "phase" | "task" | "deliverable"
      severity_level: "faible" | "moyen" | "élevé" | "critique"
      source_type:
        | "CCTP"
        | "NoteCadrage"
        | "MemoireTechnique"
        | "CR"
        | "Email"
        | "Annexe"
        | "Autre"
      task_status: "à_faire" | "en_cours" | "terminé" | "bloqué"
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
      change_request_status: ["proposé", "validé", "rejeté"],
      constraint_rule_type: [
        "date_fixed",
        "dependency",
        "min_duration",
        "max_duration",
        "must_follow",
        "resource_limit",
      ],
      deliverable_status: [
        "à_venir",
        "en_cours",
        "en_revue",
        "validé",
        "en_retard",
      ],
      extracted_by: ["IA", "Humain"],
      impact_type: ["délai", "coût", "ressource", "livrable", "risque"],
      module_key: [
        "planning",
        "documents",
        "concertation",
        "questionnaires",
        "contributions",
        "dashboards",
        "livrables",
      ],
      project_status: ["brouillon", "actif", "en_pause", "terminé", "archivé"],
      schedule_item_type: ["phase", "task", "deliverable"],
      severity_level: ["faible", "moyen", "élevé", "critique"],
      source_type: [
        "CCTP",
        "NoteCadrage",
        "MemoireTechnique",
        "CR",
        "Email",
        "Annexe",
        "Autre",
      ],
      task_status: ["à_faire", "en_cours", "terminé", "bloqué"],
    },
  },
} as const
