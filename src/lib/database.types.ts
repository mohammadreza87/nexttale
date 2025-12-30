export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          points: number | null;
          requirement_type: string;
          requirement_value: number | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          points?: number | null;
          requirement_type: string;
          requirement_value?: number | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          points?: number | null;
          requirement_type?: string;
          requirement_value?: number | null;
        };
        Relationships: [];
      };
      generation_queue: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          max_retries: number | null;
          priority: number | null;
          retry_count: number | null;
          started_at: string | null;
          status: string;
          story_id: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          max_retries?: number | null;
          priority?: number | null;
          retry_count?: number | null;
          started_at?: string | null;
          status?: string;
          story_id: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          max_retries?: number | null;
          priority?: number | null;
          retry_count?: number | null;
          started_at?: string | null;
          status?: string;
          story_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'generation_queue_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: true;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      interactive_comments: {
        Row: {
          content: string;
          content_id: string;
          created_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          content_id: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          content_id?: string;
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interactive_comments_content_id_fkey';
            columns: ['content_id'];
            isOneToOne: false;
            referencedRelation: 'interactive_content';
            referencedColumns: ['id'];
          },
        ];
      };
      interactive_content: {
        Row: {
          category: string | null;
          comment_count: number | null;
          content_type: Database['public']['Enums']['content_type'];
          created_at: string | null;
          created_by: string | null;
          description: string;
          dislikes_count: number | null;
          estimated_interaction_time: number | null;
          generation_model: string | null;
          generation_prompt: string;
          generation_tokens_used: number | null;
          html_content: string;
          html_version: number | null;
          id: string;
          is_public: boolean | null;
          likes_count: number | null;
          preview_gif_url: string | null;
          share_count: number | null;
          tags: string[] | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          category?: string | null;
          comment_count?: number | null;
          content_type?: Database['public']['Enums']['content_type'];
          created_at?: string | null;
          created_by?: string | null;
          description: string;
          dislikes_count?: number | null;
          estimated_interaction_time?: number | null;
          generation_model?: string | null;
          generation_prompt: string;
          generation_tokens_used?: number | null;
          html_content: string;
          html_version?: number | null;
          id?: string;
          is_public?: boolean | null;
          likes_count?: number | null;
          preview_gif_url?: string | null;
          share_count?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          category?: string | null;
          comment_count?: number | null;
          content_type?: Database['public']['Enums']['content_type'];
          created_at?: string | null;
          created_by?: string | null;
          description?: string;
          dislikes_count?: number | null;
          estimated_interaction_time?: number | null;
          generation_model?: string | null;
          generation_prompt?: string;
          generation_tokens_used?: number | null;
          html_content?: string;
          html_version?: number | null;
          id?: string;
          is_public?: boolean | null;
          likes_count?: number | null;
          preview_gif_url?: string | null;
          share_count?: number | null;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [];
      };
      interactive_reactions: {
        Row: {
          content_id: string;
          created_at: string | null;
          id: string;
          reaction_type: string;
          user_id: string;
        };
        Insert: {
          content_id: string;
          created_at?: string | null;
          id?: string;
          reaction_type: string;
          user_id: string;
        };
        Update: {
          content_id?: string;
          created_at?: string | null;
          id?: string;
          reaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'interactive_reactions_content_id_fkey';
            columns: ['content_id'];
            isOneToOne: false;
            referencedRelation: 'interactive_content';
            referencedColumns: ['id'];
          },
        ];
      };
      interactive_views: {
        Row: {
          content_id: string;
          duration_seconds: number | null;
          id: string;
          session_id: string | null;
          user_id: string | null;
          viewed_at: string | null;
        };
        Insert: {
          content_id: string;
          duration_seconds?: number | null;
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          viewed_at?: string | null;
        };
        Update: {
          content_id?: string;
          duration_seconds?: number | null;
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'interactive_views_content_id_fkey';
            columns: ['content_id'];
            isOneToOne: false;
            referencedRelation: 'interactive_content';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          creating_points: number | null;
          display_name: string | null;
          experience_points: number | null;
          followers_count: number | null;
          following_count: number | null;
          full_name: string | null;
          id: string;
          is_grandfathered: boolean | null;
          is_profile_public: boolean | null;
          last_generation_date: string | null;
          level: number | null;
          reading_points: number | null;
          stories_generated_today: number | null;
          stripe_customer_id: string | null;
          subscription_status: string | null;
          subscription_tier: string | null;
          total_points: number | null;
          total_stories_generated: number | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          creating_points?: number | null;
          display_name?: string | null;
          experience_points?: number | null;
          followers_count?: number | null;
          following_count?: number | null;
          full_name?: string | null;
          id: string;
          is_grandfathered?: boolean | null;
          is_profile_public?: boolean | null;
          last_generation_date?: string | null;
          level?: number | null;
          reading_points?: number | null;
          stories_generated_today?: number | null;
          stripe_customer_id?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          total_points?: number | null;
          total_stories_generated?: number | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          creating_points?: number | null;
          display_name?: string | null;
          experience_points?: number | null;
          followers_count?: number | null;
          following_count?: number | null;
          full_name?: string | null;
          id?: string;
          is_grandfathered?: boolean | null;
          is_profile_public?: boolean | null;
          last_generation_date?: string | null;
          level?: number | null;
          reading_points?: number | null;
          stories_generated_today?: number | null;
          stripe_customer_id?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          total_points?: number | null;
          total_stories_generated?: number | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      quests: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_daily: boolean | null;
          reward_points: number | null;
          target_value: number | null;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_daily?: boolean | null;
          reward_points?: number | null;
          target_value?: number | null;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_daily?: boolean | null;
          reward_points?: number | null;
          target_value?: number | null;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      rate_limit_config: {
        Row: {
          created_at: string | null;
          endpoint: string;
          free_limit: number;
          id: string;
          pro_limit: number;
          updated_at: string | null;
          window_minutes: number;
        };
        Insert: {
          created_at?: string | null;
          endpoint: string;
          free_limit?: number;
          id?: string;
          pro_limit?: number;
          updated_at?: string | null;
          window_minutes?: number;
        };
        Update: {
          created_at?: string | null;
          endpoint?: string;
          free_limit?: number;
          id?: string;
          pro_limit?: number;
          updated_at?: string | null;
          window_minutes?: number;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          created_at: string | null;
          endpoint: string;
          id: string;
          request_count: number | null;
          user_id: string;
          window_start: string | null;
        };
        Insert: {
          created_at?: string | null;
          endpoint: string;
          id?: string;
          request_count?: number | null;
          user_id: string;
          window_start?: string | null;
        };
        Update: {
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          request_count?: number | null;
          user_id?: string;
          window_start?: string | null;
        };
        Relationships: [];
      };
      reading_progress: {
        Row: {
          id: string;
          node_id: string;
          read_at: string | null;
          story_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          node_id: string;
          read_at?: string | null;
          story_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          node_id?: string;
          read_at?: string | null;
          story_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reading_progress_node_id_fkey';
            columns: ['node_id'];
            isOneToOne: false;
            referencedRelation: 'story_nodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reading_progress_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      stories: {
        Row: {
          age_range: string | null;
          art_style: string | null;
          completion_count: number | null;
          content: Json | null;
          cover_image_url: string | null;
          cover_video_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          dislikes_count: number | null;
          estimated_duration: number | null;
          generation_completed_at: string | null;
          generation_progress: number | null;
          generation_started_at: string | null;
          generation_status: string | null;
          genre: string | null;
          id: string;
          is_public: boolean | null;
          is_published: boolean | null;
          is_user_generated: boolean | null;
          language: string | null;
          likes: number | null;
          likes_count: number | null;
          narrator_enabled: boolean | null;
          nodes_generated: number | null;
          reads: number | null;
          story_context: string | null;
          target_audience: string | null;
          title: string;
          total_nodes_planned: number | null;
          updated_at: string;
          user_id: string | null;
          video_enabled: boolean | null;
        };
        Insert: {
          age_range?: string | null;
          art_style?: string | null;
          completion_count?: number | null;
          content?: Json | null;
          cover_image_url?: string | null;
          cover_video_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          dislikes_count?: number | null;
          estimated_duration?: number | null;
          generation_completed_at?: string | null;
          generation_progress?: number | null;
          generation_started_at?: string | null;
          generation_status?: string | null;
          genre?: string | null;
          id?: string;
          is_public?: boolean | null;
          is_published?: boolean | null;
          is_user_generated?: boolean | null;
          language?: string | null;
          likes?: number | null;
          likes_count?: number | null;
          narrator_enabled?: boolean | null;
          nodes_generated?: number | null;
          reads?: number | null;
          story_context?: string | null;
          target_audience?: string | null;
          title: string;
          total_nodes_planned?: number | null;
          updated_at?: string;
          user_id?: string | null;
          video_enabled?: boolean | null;
        };
        Update: {
          age_range?: string | null;
          art_style?: string | null;
          completion_count?: number | null;
          content?: Json | null;
          cover_image_url?: string | null;
          cover_video_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          dislikes_count?: number | null;
          estimated_duration?: number | null;
          generation_completed_at?: string | null;
          generation_progress?: number | null;
          generation_started_at?: string | null;
          generation_status?: string | null;
          genre?: string | null;
          id?: string;
          is_public?: boolean | null;
          is_published?: boolean | null;
          is_user_generated?: boolean | null;
          language?: string | null;
          likes?: number | null;
          likes_count?: number | null;
          narrator_enabled?: boolean | null;
          nodes_generated?: number | null;
          reads?: number | null;
          story_context?: string | null;
          target_audience?: string | null;
          title?: string;
          total_nodes_planned?: number | null;
          updated_at?: string;
          user_id?: string | null;
          video_enabled?: boolean | null;
        };
        Relationships: [];
      };
      story_choices: {
        Row: {
          choice_order: number | null;
          choice_text: string;
          consequence_hint: string | null;
          created_at: string | null;
          from_node_id: string;
          id: string;
          to_node_id: string;
        };
        Insert: {
          choice_order?: number | null;
          choice_text: string;
          consequence_hint?: string | null;
          created_at?: string | null;
          from_node_id: string;
          id?: string;
          to_node_id: string;
        };
        Update: {
          choice_order?: number | null;
          choice_text?: string;
          consequence_hint?: string | null;
          created_at?: string | null;
          from_node_id?: string;
          id?: string;
          to_node_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'story_choices_from_node_id_fkey';
            columns: ['from_node_id'];
            isOneToOne: false;
            referencedRelation: 'story_nodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'story_choices_to_node_id_fkey';
            columns: ['to_node_id'];
            isOneToOne: false;
            referencedRelation: 'story_nodes';
            referencedColumns: ['id'];
          },
        ];
      };
      story_comments: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          parent_id: string | null;
          story_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          parent_id?: string | null;
          story_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          parent_id?: string | null;
          story_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'story_comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'story_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'story_comments_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      story_completions: {
        Row: {
          completed_at: string | null;
          id: string;
          story_id: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          id?: string;
          story_id: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          id?: string;
          story_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'story_completions_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      story_nodes: {
        Row: {
          audio_url: string | null;
          content: string;
          created_at: string | null;
          ending_type: string | null;
          generation_attempts: number | null;
          generation_failed: boolean | null;
          id: string;
          image_prompt: string | null;
          image_url: string | null;
          is_ending: boolean | null;
          is_placeholder: boolean | null;
          node_key: string;
          order_index: number | null;
          parent_choice_id: string | null;
          story_id: string;
          video_error: string | null;
          video_generation_id: string | null;
          video_status: string | null;
          video_url: string | null;
        };
        Insert: {
          audio_url?: string | null;
          content: string;
          created_at?: string | null;
          ending_type?: string | null;
          generation_attempts?: number | null;
          generation_failed?: boolean | null;
          id?: string;
          image_prompt?: string | null;
          image_url?: string | null;
          is_ending?: boolean | null;
          is_placeholder?: boolean | null;
          node_key: string;
          order_index?: number | null;
          parent_choice_id?: string | null;
          story_id: string;
          video_error?: string | null;
          video_generation_id?: string | null;
          video_status?: string | null;
          video_url?: string | null;
        };
        Update: {
          audio_url?: string | null;
          content?: string;
          created_at?: string | null;
          ending_type?: string | null;
          generation_attempts?: number | null;
          generation_failed?: boolean | null;
          id?: string;
          image_prompt?: string | null;
          image_url?: string | null;
          is_ending?: boolean | null;
          is_placeholder?: boolean | null;
          node_key?: string;
          order_index?: number | null;
          parent_choice_id?: string | null;
          story_id?: string;
          video_error?: string | null;
          video_generation_id?: string | null;
          video_status?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'story_nodes_parent_choice_id_fkey';
            columns: ['parent_choice_id'];
            isOneToOne: false;
            referencedRelation: 'story_choices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'story_nodes_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      story_reactions: {
        Row: {
          created_at: string | null;
          id: string;
          reaction_type: string;
          story_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          reaction_type: string;
          story_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          reaction_type?: string;
          story_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'story_reactions_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      story_stats: {
        Row: {
          created_at: string;
          id: string;
          liked: boolean | null;
          read: boolean | null;
          story_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          liked?: boolean | null;
          read?: boolean | null;
          story_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          liked?: boolean | null;
          read?: boolean | null;
          story_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'story_stats_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_customers: {
        Row: {
          created_at: string | null;
          customer_id: string;
          deleted_at: string | null;
          id: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          customer_id: string;
          deleted_at?: string | null;
          id?: never;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          customer_id?: string;
          deleted_at?: string | null;
          id?: never;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      stripe_orders: {
        Row: {
          amount_subtotal: number;
          amount_total: number;
          checkout_session_id: string;
          created_at: string | null;
          currency: string;
          customer_id: string;
          deleted_at: string | null;
          id: number;
          payment_intent_id: string;
          payment_status: string;
          status: Database['public']['Enums']['stripe_order_status'];
          updated_at: string | null;
        };
        Insert: {
          amount_subtotal: number;
          amount_total: number;
          checkout_session_id: string;
          created_at?: string | null;
          currency: string;
          customer_id: string;
          deleted_at?: string | null;
          id?: never;
          payment_intent_id: string;
          payment_status: string;
          status?: Database['public']['Enums']['stripe_order_status'];
          updated_at?: string | null;
        };
        Update: {
          amount_subtotal?: number;
          amount_total?: number;
          checkout_session_id?: string;
          created_at?: string | null;
          currency?: string;
          customer_id?: string;
          deleted_at?: string | null;
          id?: never;
          payment_intent_id?: string;
          payment_status?: string;
          status?: Database['public']['Enums']['stripe_order_status'];
          updated_at?: string | null;
        };
        Relationships: [];
      };
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: number | null;
          current_period_start: number | null;
          customer_id: string;
          deleted_at: string | null;
          id: number;
          payment_method_brand: string | null;
          payment_method_last4: string | null;
          price_id: string | null;
          status: Database['public']['Enums']['stripe_subscription_status'];
          subscription_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: number | null;
          current_period_start?: number | null;
          customer_id: string;
          deleted_at?: string | null;
          id?: never;
          payment_method_brand?: string | null;
          payment_method_last4?: string | null;
          price_id?: string | null;
          status: Database['public']['Enums']['stripe_subscription_status'];
          subscription_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: number | null;
          current_period_start?: number | null;
          customer_id?: string;
          deleted_at?: string | null;
          id?: never;
          payment_method_brand?: string | null;
          payment_method_last4?: string | null;
          price_id?: string | null;
          status?: Database['public']['Enums']['stripe_subscription_status'];
          subscription_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          id: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          tier: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          earned_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          earned_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          earned_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'achievements';
            referencedColumns: ['id'];
          },
        ];
      };
      user_follows: {
        Row: {
          created_at: string | null;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          creating_points: number | null;
          display_name: string | null;
          id: string;
          interactive_generated_today: number | null;
          is_grandfathered: boolean | null;
          is_profile_public: boolean | null;
          last_generation_date: string | null;
          reading_points: number | null;
          stories_generated_today: number | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_period_end: string | null;
          subscription_plan: string | null;
          subscription_status: string | null;
          subscription_tier: string | null;
          total_interactive_generated: number | null;
          total_points: number | null;
          total_stories_generated: number | null;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          creating_points?: number | null;
          display_name?: string | null;
          id: string;
          interactive_generated_today?: number | null;
          is_grandfathered?: boolean | null;
          is_profile_public?: boolean | null;
          last_generation_date?: string | null;
          reading_points?: number | null;
          stories_generated_today?: number | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_period_end?: string | null;
          subscription_plan?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          total_interactive_generated?: number | null;
          total_points?: number | null;
          total_stories_generated?: number | null;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          creating_points?: number | null;
          display_name?: string | null;
          id?: string;
          interactive_generated_today?: number | null;
          is_grandfathered?: boolean | null;
          is_profile_public?: boolean | null;
          last_generation_date?: string | null;
          reading_points?: number | null;
          stories_generated_today?: number | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_period_end?: string | null;
          subscription_plan?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          total_interactive_generated?: number | null;
          total_points?: number | null;
          total_stories_generated?: number | null;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      user_quests: {
        Row: {
          created_at: string | null;
          id: string;
          period_end: string;
          period_start: string;
          progress: number;
          quest_type: string;
          reward_points: number;
          rewarded: boolean;
          status: string;
          target: number;
          task: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          period_end: string;
          period_start: string;
          progress?: number;
          quest_type: string;
          reward_points?: number;
          rewarded?: boolean;
          status?: string;
          target?: number;
          task: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          period_end?: string;
          period_start?: string;
          progress?: number;
          quest_type?: string;
          reward_points?: number;
          rewarded?: boolean;
          status?: string;
          target?: number;
          task?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_story_progress: {
        Row: {
          completed: boolean | null;
          completed_at: string | null;
          created_at: string | null;
          current_node_id: string | null;
          id: string;
          path_taken: Json | null;
          started_at: string | null;
          story_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          current_node_id?: string | null;
          id?: string;
          path_taken?: Json | null;
          started_at?: string | null;
          story_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
          current_node_id?: string | null;
          id?: string;
          path_taken?: Json | null;
          started_at?: string | null;
          story_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_story_progress_current_node_id_fkey';
            columns: ['current_node_id'];
            isOneToOne: false;
            referencedRelation: 'story_nodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_story_progress_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      user_streaks: {
        Row: {
          current_streak: number;
          last_action_date: string | null;
          longest_streak: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          current_streak?: number;
          last_action_date?: string | null;
          longest_streak?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          current_streak?: number;
          last_action_date?: string | null;
          longest_streak?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      stripe_user_orders: {
        Row: {
          amount_subtotal: number | null;
          amount_total: number | null;
          checkout_session_id: string | null;
          currency: string | null;
          customer_id: string | null;
          order_date: string | null;
          order_id: number | null;
          order_status: Database['public']['Enums']['stripe_order_status'] | null;
          payment_intent_id: string | null;
          payment_status: string | null;
        };
        Relationships: [];
      };
      stripe_user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          current_period_end: number | null;
          current_period_start: number | null;
          customer_id: string | null;
          payment_method_brand: string | null;
          payment_method_last4: string | null;
          price_id: string | null;
          subscription_id: string | null;
          subscription_status: Database['public']['Enums']['stripe_subscription_status'] | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string;
          p_max_requests: number;
          p_user_id: string;
          p_window_minutes?: number;
        };
        Returns: Json;
      };
      cleanup_old_rate_limits: { Args: never; Returns: number };
      generate_random_username: { Args: never; Returns: string };
      increment_points: {
        Args: { p_amount: number; p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      content_type: 'story' | 'game' | 'tool' | 'widget' | 'quiz' | 'visualization';
      stripe_order_status: 'pending' | 'completed' | 'canceled';
      stripe_subscription_status:
        | 'not_started'
        | 'incomplete'
        | 'incomplete_expired'
        | 'trialing'
        | 'active'
        | 'past_due'
        | 'canceled'
        | 'unpaid'
        | 'paused';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      content_type: ['story', 'game', 'tool', 'widget', 'quiz', 'visualization'],
      stripe_order_status: ['pending', 'completed', 'canceled'],
      stripe_subscription_status: [
        'not_started',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused',
      ],
    },
  },
} as const;
