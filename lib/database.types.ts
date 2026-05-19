export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audience_intelligence: {
        Row: {
          audience_profile: Json | null;
          computed_at: string | null;
          engagement_by_topic: Json | null;
          id: string;
          is_singleton: boolean | null;
          top_commenters: Json | null;
          topic_triggers: Json | null;
        };
        Insert: {
          audience_profile?: Json | null;
          computed_at?: string | null;
          engagement_by_topic?: Json | null;
          id?: string;
          is_singleton?: boolean | null;
          top_commenters?: Json | null;
          topic_triggers?: Json | null;
        };
        Update: {
          audience_profile?: Json | null;
          computed_at?: string | null;
          engagement_by_topic?: Json | null;
          id?: string;
          is_singleton?: boolean | null;
          top_commenters?: Json | null;
          topic_triggers?: Json | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      design_findings: {
        Row: {
          agreed_by: string[] | null;
          artifacts: string[] | null;
          category: string;
          challenged_by: string[] | null;
          confidence: number | null;
          created_at: string | null;
          debate_outcome: string | null;
          description: string | null;
          downstream_impact: string | null;
          finding_id: string;
          id: string;
          resolved_at: string | null;
          revised: boolean | null;
          sections: string[] | null;
          severity: string;
          source_agent: string | null;
          status: string | null;
          suggested_fix: string | null;
          title: string;
        };
        Insert: {
          agreed_by?: string[] | null;
          artifacts?: string[] | null;
          category: string;
          challenged_by?: string[] | null;
          confidence?: number | null;
          created_at?: string | null;
          debate_outcome?: string | null;
          description?: string | null;
          downstream_impact?: string | null;
          finding_id: string;
          id?: string;
          resolved_at?: string | null;
          revised?: boolean | null;
          sections?: string[] | null;
          severity: string;
          source_agent?: string | null;
          status?: string | null;
          suggested_fix?: string | null;
          title: string;
        };
        Update: {
          agreed_by?: string[] | null;
          artifacts?: string[] | null;
          category?: string;
          challenged_by?: string[] | null;
          confidence?: number | null;
          created_at?: string | null;
          debate_outcome?: string | null;
          description?: string | null;
          downstream_impact?: string | null;
          finding_id?: string;
          id?: string;
          resolved_at?: string | null;
          revised?: boolean | null;
          sections?: string[] | null;
          severity?: string;
          source_agent?: string | null;
          status?: string | null;
          suggested_fix?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      insights_cache: {
        Row: {
          aggregate_stats: Json;
          ai_summary: string | null;
          created_at: string;
          id: string;
          is_singleton: boolean;
          last_computed_at: string;
          post_count: number;
          suggested_next: Json | null;
          updated_at: string;
        };
        Insert: {
          aggregate_stats?: Json;
          ai_summary?: string | null;
          created_at?: string;
          id?: string;
          is_singleton?: boolean;
          last_computed_at?: string;
          post_count?: number;
          suggested_next?: Json | null;
          updated_at?: string;
        };
        Update: {
          aggregate_stats?: Json;
          ai_summary?: string | null;
          created_at?: string;
          id?: string;
          is_singleton?: boolean;
          last_computed_at?: string;
          post_count?: number;
          suggested_next?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      linkedin_comments: {
        Row: {
          actor_headline: string | null;
          actor_linkedin_url: string | null;
          actor_name: string | null;
          actor_profile_image: string | null;
          comment_engagement: Json | null;
          comment_id: string;
          commentary: string | null;
          commented_at: string | null;
          created_at: string | null;
          edited: boolean | null;
          id: string;
          linkedin_post_id: string;
          linkedin_url: string | null;
          pinned: boolean | null;
        };
        Insert: {
          actor_headline?: string | null;
          actor_linkedin_url?: string | null;
          actor_name?: string | null;
          actor_profile_image?: string | null;
          comment_engagement?: Json | null;
          comment_id: string;
          commentary?: string | null;
          commented_at?: string | null;
          created_at?: string | null;
          edited?: boolean | null;
          id?: string;
          linkedin_post_id: string;
          linkedin_url?: string | null;
          pinned?: boolean | null;
        };
        Update: {
          actor_headline?: string | null;
          actor_linkedin_url?: string | null;
          actor_name?: string | null;
          actor_profile_image?: string | null;
          comment_engagement?: Json | null;
          comment_id?: string;
          commentary?: string | null;
          commented_at?: string | null;
          created_at?: string | null;
          edited?: boolean | null;
          id?: string;
          linkedin_post_id?: string;
          linkedin_url?: string | null;
          pinned?: boolean | null;
        };
        Relationships: [];
      };
      linkedin_reactions: {
        Row: {
          actor_headline: string | null;
          actor_linkedin_url: string | null;
          actor_name: string | null;
          actor_profile_image: string | null;
          created_at: string | null;
          id: string;
          linkedin_post_id: string;
          reaction_type: string | null;
        };
        Insert: {
          actor_headline?: string | null;
          actor_linkedin_url?: string | null;
          actor_name?: string | null;
          actor_profile_image?: string | null;
          created_at?: string | null;
          id?: string;
          linkedin_post_id: string;
          reaction_type?: string | null;
        };
        Update: {
          actor_headline?: string | null;
          actor_linkedin_url?: string | null;
          actor_name?: string | null;
          actor_profile_image?: string | null;
          created_at?: string | null;
          id?: string;
          linkedin_post_id?: string;
          reaction_type?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          message_type: string;
          metadata: Json | null;
          role: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          message_type?: string;
          metadata?: Json | null;
          role: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          message_type?: string;
          metadata?: Json | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      pillar_metrics: {
        Row: {
          avg_score: number | null;
          calibrated_weight: number | null;
          created_at: string | null;
          engagement_correlation: number | null;
          engagement_delta: number | null;
          id: string;
          last_calibrated_at: string | null;
          pillar_code: string;
          pillar_name: string;
          rank: number | null;
          recommendation: string | null;
          verdict: string | null;
          weight: number | null;
        };
        Insert: {
          avg_score?: number | null;
          calibrated_weight?: number | null;
          created_at?: string | null;
          engagement_correlation?: number | null;
          engagement_delta?: number | null;
          id?: string;
          last_calibrated_at?: string | null;
          pillar_code: string;
          pillar_name: string;
          rank?: number | null;
          recommendation?: string | null;
          verdict?: string | null;
          weight?: number | null;
        };
        Update: {
          avg_score?: number | null;
          calibrated_weight?: number | null;
          created_at?: string | null;
          engagement_correlation?: number | null;
          engagement_delta?: number | null;
          id?: string;
          last_calibrated_at?: string | null;
          pillar_code?: string;
          pillar_name?: string;
          rank?: number | null;
          recommendation?: string | null;
          verdict?: string | null;
          weight?: number | null;
        };
        Relationships: [];
      };
      post_images: {
        Row: {
          created_at: string | null;
          id: string;
          mime_type: string;
          model: string;
          post_id: string | null;
          storage_path: string;
          style: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          mime_type?: string;
          model?: string;
          post_id?: string | null;
          storage_path: string;
          style: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          mime_type?: string;
          model?: string;
          post_id?: string | null;
          storage_path?: string;
          style?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_versions: {
        Row: {
          change_description: string | null;
          content: string;
          conversation_id: string | null;
          created_at: string | null;
          id: string;
          post_id: string | null;
          scores: Json | null;
          version_number: number;
          word_count: number | null;
        };
        Insert: {
          change_description?: string | null;
          content: string;
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          post_id?: string | null;
          scores?: Json | null;
          version_number: number;
          word_count?: number | null;
        };
        Update: {
          change_description?: string | null;
          content?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          post_id?: string | null;
          scores?: Json | null;
          version_number?: number;
          word_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "post_versions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_versions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          annotations: string | null;
          audience: string | null;
          comment_ratio: number | null;
          comments: number | null;
          compliance_results: Json | null;
          content_attributes: Json | null;
          contrarian_score: number | null;
          conversation_id: string | null;
          copied_at: string | null;
          created_at: string;
          current_version_id: string | null;
          dominant_reaction: string | null;
          engagement_total: number | null;
          format_score: number | null;
          framework_score: number | null;
          generated_content: string;
          generated_from_id: string | null;
          generation_metadata: Json | null;
          hook_score: number | null;
          content_score_total: number | null;
          id: string;
          impressions: number | null;
          last_synced_at: string | null;
          likes: number | null;
          linkedin_post_id: string | null;
          linkedin_url: string | null;
          mode: string;
          model: string;
          post_images: Json | null;
          post_type: string | null;
          posted_at: string | null;
          publication_edits: Json | null;
          reaction_breakdown: Json | null;
          refinement_history: Json | null;
          score_explanation: Json | null;
          scoring_tips: string[] | null;
          shares: number | null;
          source: string;
          story_score: number | null;
          template: string;
          updated_at: string;
          user_input: string | null;
          value_score: number | null;
          word_count: number | null;
        };
        Insert: {
          annotations?: string | null;
          audience?: string | null;
          comment_ratio?: number | null;
          comments?: number | null;
          compliance_results?: Json | null;
          content_attributes?: Json | null;
          contrarian_score?: number | null;
          conversation_id?: string | null;
          copied_at?: string | null;
          created_at?: string;
          current_version_id?: string | null;
          dominant_reaction?: string | null;
          engagement_total?: number | null;
          format_score?: number | null;
          framework_score?: number | null;
          generated_content: string;
          generated_from_id?: string | null;
          generation_metadata?: Json | null;
          hook_score?: number | null;
          content_score_total?: number | null;
          id?: string;
          impressions?: number | null;
          last_synced_at?: string | null;
          likes?: number | null;
          linkedin_post_id?: string | null;
          linkedin_url?: string | null;
          mode?: string;
          model?: string;
          post_images?: Json | null;
          post_type?: string | null;
          posted_at?: string | null;
          publication_edits?: Json | null;
          reaction_breakdown?: Json | null;
          refinement_history?: Json | null;
          score_explanation?: Json | null;
          scoring_tips?: string[] | null;
          shares?: number | null;
          source?: string;
          story_score?: number | null;
          template?: string;
          updated_at?: string;
          user_input?: string | null;
          value_score?: number | null;
          word_count?: number | null;
        };
        Update: {
          annotations?: string | null;
          audience?: string | null;
          comment_ratio?: number | null;
          comments?: number | null;
          compliance_results?: Json | null;
          content_attributes?: Json | null;
          contrarian_score?: number | null;
          conversation_id?: string | null;
          copied_at?: string | null;
          created_at?: string;
          current_version_id?: string | null;
          dominant_reaction?: string | null;
          engagement_total?: number | null;
          format_score?: number | null;
          framework_score?: number | null;
          generated_content?: string;
          generated_from_id?: string | null;
          generation_metadata?: Json | null;
          hook_score?: number | null;
          content_score_total?: number | null;
          id?: string;
          impressions?: number | null;
          last_synced_at?: string | null;
          likes?: number | null;
          linkedin_post_id?: string | null;
          linkedin_url?: string | null;
          mode?: string;
          model?: string;
          post_images?: Json | null;
          post_type?: string | null;
          posted_at?: string | null;
          publication_edits?: Json | null;
          reaction_breakdown?: Json | null;
          refinement_history?: Json | null;
          score_explanation?: Json | null;
          scoring_tips?: string[] | null;
          shares?: number | null;
          source?: string;
          story_score?: number | null;
          template?: string;
          updated_at?: string;
          user_input?: string | null;
          value_score?: number | null;
          word_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_current_version_id_fkey";
            columns: ["current_version_id"];
            isOneToOne: false;
            referencedRelation: "post_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_generated_from_id_fkey";
            columns: ["generated_from_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          anthropic_api_key_encrypted: string | null;
          created_at: string;
          default_model: string;
          default_target_length: number | null;
          id: string;
          is_singleton: boolean;
          linkedin_profile_url: string | null;
          openai_api_key_encrypted: string | null;
          password_hash: string;
          search_api_key_encrypted: string | null;
          updated_at: string;
        };
        Insert: {
          anthropic_api_key_encrypted?: string | null;
          created_at?: string;
          default_model?: string;
          default_target_length?: number | null;
          id?: string;
          is_singleton?: boolean;
          linkedin_profile_url?: string | null;
          openai_api_key_encrypted?: string | null;
          password_hash: string;
          search_api_key_encrypted?: string | null;
          updated_at?: string;
        };
        Update: {
          anthropic_api_key_encrypted?: string | null;
          created_at?: string;
          default_model?: string;
          default_target_length?: number | null;
          id?: string;
          is_singleton?: boolean;
          linkedin_profile_url?: string | null;
          openai_api_key_encrypted?: string | null;
          password_hash?: string;
          search_api_key_encrypted?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      signature_phrases: {
        Row: {
          category: string | null;
          created_at: string | null;
          frequency: number | null;
          id: string;
          phrase: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          frequency?: number | null;
          id?: string;
          phrase: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          frequency?: number | null;
          id?: string;
          phrase?: string;
        };
        Relationships: [];
      };
      swarm_plans: {
        Row: {
          confidence_self_assessed: number | null;
          created_at: string | null;
          id: string;
          lane: string | null;
          mode: string | null;
          new_files: Json | null;
          notes: string | null;
          planned_at: string | null;
          planner: string | null;
          revisions: Json | null;
          rollback_safe: boolean | null;
          task_id: string | null;
          title: string | null;
          verification_steps: Json | null;
        };
        Insert: {
          confidence_self_assessed?: number | null;
          created_at?: string | null;
          id?: string;
          lane?: string | null;
          mode?: string | null;
          new_files?: Json | null;
          notes?: string | null;
          planned_at?: string | null;
          planner?: string | null;
          revisions?: Json | null;
          rollback_safe?: boolean | null;
          task_id?: string | null;
          title?: string | null;
          verification_steps?: Json | null;
        };
        Update: {
          confidence_self_assessed?: number | null;
          created_at?: string | null;
          id?: string;
          lane?: string | null;
          mode?: string | null;
          new_files?: Json | null;
          notes?: string | null;
          planned_at?: string | null;
          planner?: string | null;
          revisions?: Json | null;
          rollback_safe?: boolean | null;
          task_id?: string | null;
          title?: string | null;
          verification_steps?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "swarm_plans_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "swarm_tasks";
            referencedColumns: ["task_id"];
          },
        ];
      };
      swarm_tasks: {
        Row: {
          artifacts: string[] | null;
          completed_at: string | null;
          confidence: number | null;
          conflicts_with: string[] | null;
          created_at: string | null;
          execution_group: number | null;
          execution_order: number | null;
          finding_id: string | null;
          fixer: string | null;
          ice_score: number | null;
          id: string;
          lane: string;
          planner: string | null;
          risk: string | null;
          sections: string[] | null;
          status: string | null;
          task_id: string;
          title: string;
        };
        Insert: {
          artifacts?: string[] | null;
          completed_at?: string | null;
          confidence?: number | null;
          conflicts_with?: string[] | null;
          created_at?: string | null;
          execution_group?: number | null;
          execution_order?: number | null;
          finding_id?: string | null;
          fixer?: string | null;
          ice_score?: number | null;
          id?: string;
          lane: string;
          planner?: string | null;
          risk?: string | null;
          sections?: string[] | null;
          status?: string | null;
          task_id: string;
          title: string;
        };
        Update: {
          artifacts?: string[] | null;
          completed_at?: string | null;
          confidence?: number | null;
          conflicts_with?: string[] | null;
          created_at?: string | null;
          execution_group?: number | null;
          execution_order?: number | null;
          finding_id?: string | null;
          fixer?: string | null;
          ice_score?: number | null;
          id?: string;
          lane?: string;
          planner?: string | null;
          risk?: string | null;
          sections?: string[] | null;
          status?: string | null;
          task_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "swarm_tasks_finding_id_fkey";
            columns: ["finding_id"];
            isOneToOne: false;
            referencedRelation: "design_findings";
            referencedColumns: ["finding_id"];
          },
        ];
      };
      voice_metrics: {
        Row: {
          adoption_priority: string | null;
          category: string | null;
          created_at: string | null;
          gap_severity: string | null;
          copywriting_value: string | null;
          id: string;
          metric_name: string;
          creator_value: string | null;
          technique_reference: string | null;
        };
        Insert: {
          adoption_priority?: string | null;
          category?: string | null;
          created_at?: string | null;
          gap_severity?: string | null;
          copywriting_value?: string | null;
          id?: string;
          metric_name: string;
          creator_value?: string | null;
          technique_reference?: string | null;
        };
        Update: {
          adoption_priority?: string | null;
          category?: string | null;
          created_at?: string | null;
          gap_severity?: string | null;
          copywriting_value?: string | null;
          id?: string;
          metric_name?: string;
          creator_value?: string | null;
          technique_reference?: string | null;
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
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
