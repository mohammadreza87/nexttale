export interface Database {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string;
          title: string;
          description: string;
          cover_image_url: string | null;
          age_range: string;
          estimated_duration: number;
          story_context: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['stories']['Insert']>;
      };
      story_nodes: {
        Row: {
          id: string;
          story_id: string;
          node_key: string;
          content: string;
          is_ending: boolean;
          ending_type: string | null;
          order_index: number;
          image_url: string | null;
          image_prompt: string | null;
          audio_url: string | null;
          parent_choice_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['story_nodes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['story_nodes']['Insert']>;
      };
      story_choices: {
        Row: {
          id: string;
          from_node_id: string;
          to_node_id: string;
          choice_text: string;
          consequence_hint: string | null;
          choice_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['story_choices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['story_choices']['Insert']>;
      };
      user_story_progress: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          current_node_id: string | null;
          path_taken: string[];
          completed: boolean;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['user_story_progress']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['user_story_progress']['Insert']>;
      };
    };
  };
}

export interface StoryNode {
  id: string;
  story_id: string;
  node_key: string;
  content: string;
  is_ending: boolean;
  ending_type: string | null;
  order_index: number;
  image_url?: string | null;
  image_prompt?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
}

export interface StoryChoice {
  id: string;
  from_node_id: string;
  to_node_id: string;
  choice_text: string;
  consequence_hint: string | null;
  choice_order: number;
  created_by?: string | null;
  is_public?: boolean;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  cover_video_url?: string | null;
  age_range: string;
  estimated_duration: number;
  story_context?: string | null;
  likes_count?: number;
  dislikes_count?: number;
  completion_count?: number;
  comment_count?: number;
  created_by?: string | null;
  is_public?: boolean;
  is_user_generated?: boolean;
  image_prompt?: string | null;
  generation_status?: string;
  generation_progress?: number;
  nodes_generated?: number;
  total_nodes_planned?: number;
  language?: string | null;
  narrator_enabled?: boolean;
  video_enabled?: boolean;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface StoryReaction {
  id: string;
  user_id: string;
  story_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

export type SubscriptionPlan = 'basic' | 'pro' | 'max';

export interface UserProfile {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  username?: string;
  subscription_tier: 'free' | 'pro';
  subscription_plan: SubscriptionPlan | null;
  subscription_status: string;
  subscription_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_grandfathered: boolean;
  stories_generated_today: number;
  last_generation_date: string | null;
  total_stories_generated: number;
  total_points: number;
  reading_points: number;
  creating_points: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Story Memory & Outline Types for Coherence
// ============================================

/**
 * Character definition for consistent appearance across chapters
 */
export interface StoryCharacter {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  age?: string;
  appearance: string; // Detailed physical description
  clothing: string; // What they're wearing
  personality: string;
  goal?: string;
}

/**
 * Chapter outline for structured story generation
 */
export interface ChapterOutline {
  chapterNumber: number;
  title: string;
  keyEvent: string; // What MUST happen in this chapter
  conflict: string; // Problem introduced or escalated
  emotionalBeat: string; // How the reader should feel
  endState: string; // How chapter ends, leading to next
  mustReference: string[]; // Plot threads that must be referenced
}

/**
 * Pre-generated story structure to ensure narrative coherence
 */
export interface StoryOutline {
  premise: string;
  theme: string;
  setting: {
    location: string;
    timeOfDay: string;
    atmosphere: string;
    consistentElements: string[]; // Elements that should appear in all images
  };
  characters: StoryCharacter[];
  plotThreads: {
    id: string;
    description: string;
    introducedInChapter: number;
    resolvedInChapter?: number;
  }[];
  chapters: ChapterOutline[];
  resolution: string;
  totalChapters: number;
}

/**
 * Accumulated story memory for context passing between chapters
 */
export interface StoryMemory {
  currentChapter: number;
  characters: StoryCharacter[];
  keyEvents: {
    chapter: number;
    event: string;
    importance: 'critical' | 'major' | 'minor';
  }[];
  currentConflict: string;
  unresolvedThreads: {
    id: string;
    description: string;
    introducedInChapter: number;
  }[];
  resolvedThreads: {
    id: string;
    description: string;
    resolvedInChapter: number;
  }[];
  setting: {
    currentLocation: string;
    previousLocations: string[];
  };
  emotionalArc: string; // Current emotional state of the story
  foreshadowing: string[]; // Elements hinted at for later
}

/**
 * Image generation context for visual consistency
 */
export interface ImageContext {
  characterAppearances: {
    name: string;
    fullDescription: string; // Complete visual description for image gen
  }[];
  settingDescription: string;
  artStyle: string;
  colorPalette: string[];
  consistentElements: string[];
  previousImagePrompts: string[]; // Last 2-3 prompts for style matching
  currentSceneDescription: string;
}

/**
 * Extended StoryNode with memory fields
 */
export interface StoryNodeWithMemory extends StoryNode {
  chapter_summary?: string;
  character_states?: Record<string, string>; // Character name -> state in this chapter
  image_context?: ImageContext;
}

/**
 * Extended Story with memory and outline
 */
export interface StoryWithMemory extends Story {
  story_outline?: StoryOutline;
  story_memory?: StoryMemory;
  art_style?: string;
}
