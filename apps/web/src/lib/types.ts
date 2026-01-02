// Re-export Database type from generated types
export type { Database } from './database.types';

export interface StoryNode {
  id: string;
  story_id: string;
  node_key: string;
  content: string;
  is_ending: boolean | null;
  ending_type: string | null;
  order_index?: number | null;
  image_url?: string | null;
  image_prompt?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  sequence_order?: number | null;
  created_at?: string | null;
  parent_choice_id?: string | null;
}

export interface StoryChoice {
  id: string;
  from_node_id: string;
  to_node_id: string;
  choice_text: string;
  consequence_hint: string | null;
  choice_order: number | null;
  created_by?: string | null;
  is_public?: boolean;
  hint?: string | null;
}

export interface Story {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cover_video_url?: string | null;
  age_range: string | null;
  estimated_duration: number | null;
  story_context?: string | null;
  likes_count?: number | null;
  dislikes_count?: number | null;
  completion_count?: number | null;
  comment_count?: number | null;
  created_by?: string | null;
  created_at?: string | null;
  is_public?: boolean | null;
  is_user_generated?: boolean | null;
  image_prompt?: string | null;
  generation_status?: string | null;
  generation_progress?: number | null;
  nodes_generated?: number | null;
  total_nodes_planned?: number | null;
  language?: string | null;
  narrator_enabled?: boolean | null;
  video_enabled?: boolean | null;
  art_style?: string | null;
  story_outline?: StoryOutline | null;
  story_memory?: StoryMemory | null;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface StoryReaction {
  id: string;
  user_id: string;
  story_id: string;
  reaction_type: 'like' | 'dislike' | string;
  created_at: string | null;
}

export type SubscriptionPlan = 'basic' | 'pro' | 'max';

export interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  username?: string | null;
  subscription_tier: 'free' | 'pro' | null;
  subscription_plan: SubscriptionPlan | null;
  subscription_status: string | null;
  subscription_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_grandfathered: boolean | null;
  stories_generated_today: number | null;
  last_generation_date: string | null;
  total_stories_generated: number | null;
  total_points: number | null;
  reading_points: number | null;
  creating_points: number | null;
  created_at: string | null;
  updated_at: string | null;
  followers_count?: number | null;
  following_count?: number | null;
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
