import { z } from 'zod';

// ============================================
// Zod Schemas for Runtime Validation
// ============================================

export const StoryCharacterSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'love_interest', 'ally', 'mysterious_figure']),
  age: z.string().optional(),
  appearance: z.string().min(10),
  clothing: z.string().min(5),
  personality: z.string().min(10),
  motivation: z.string().optional(),
  goal: z.string().optional(),
});

export const ChapterOutlineSchema = z.object({
  chapterNumber: z.number().int().positive(),
  title: z.string().min(1),
  keyEvent: z.string().min(10),
  conflict: z.string().min(10),
  emotionalBeat: z.string(),
  endState: z.string(),
  mustReference: z.array(z.string()),
});

export const StoryOutlineSchema = z.object({
  premise: z.string().min(20),
  theme: z.string(),
  genre: z.string().optional(),
  tone: z.string().optional(),
  setting: z.object({
    location: z.string(),
    timePeriod: z.string().optional(),
    timeOfDay: z.string(),
    atmosphere: z.string(),
    consistentElements: z.array(z.string()),
  }),
  characters: z.array(StoryCharacterSchema).min(1),
  plotThreads: z.array(z.object({
    id: z.string(),
    description: z.string(),
    introducedInChapter: z.number(),
    resolvedInChapter: z.number().optional(),
    stakes: z.string().optional(),
  })),
  chapters: z.array(ChapterOutlineSchema).min(5),
  resolution: z.string(),
  totalChapters: z.number().min(5).max(10),
});

export const StoryMemorySchema = z.object({
  currentChapter: z.number(),
  characters: z.array(StoryCharacterSchema),
  keyEvents: z.array(z.object({
    chapter: z.number(),
    event: z.string(),
    importance: z.enum(['critical', 'major', 'minor']),
  })),
  currentConflict: z.string(),
  unresolvedThreads: z.array(z.object({
    id: z.string(),
    description: z.string(),
    introducedInChapter: z.number(),
  })),
  resolvedThreads: z.array(z.object({
    id: z.string(),
    description: z.string(),
    resolvedInChapter: z.number(),
  })),
  setting: z.object({
    currentLocation: z.string(),
    previousLocations: z.array(z.string()),
  }),
  emotionalArc: z.string(),
  foreshadowing: z.array(z.string()),
});

export const GeneratedChapterSchema = z.object({
  content: z.string().min(100),
  choices: z.array(z.object({
    text: z.string().min(10),
    hint: z.string(),
  })),
  isEnding: z.boolean(),
  endingType: z.enum(['happy', 'bittersweet', 'tragic', 'ambiguous', 'triumphant', 'satisfying']).nullable(),
  chapterSummary: z.string().optional(),
  memoryUpdates: z.object({
    keyEvents: z.array(z.object({
      event: z.string(),
      importance: z.enum(['critical', 'major', 'minor']),
    })).optional(),
    resolvedThreads: z.array(z.string()).optional(),
    newLocation: z.string().nullable().optional(),
    newConflict: z.string().nullable().optional(),
  }).optional(),
});

// ============================================
// TypeScript Types (derived from Zod schemas)
// ============================================

export type StoryCharacter = z.infer<typeof StoryCharacterSchema>;
export type ChapterOutline = z.infer<typeof ChapterOutlineSchema>;
export type StoryOutline = z.infer<typeof StoryOutlineSchema>;
export type StoryMemory = z.infer<typeof StoryMemorySchema>;
export type GeneratedChapter = z.infer<typeof GeneratedChapterSchema>;

// ============================================
// Database Types (matching Supabase schema)
// ============================================

export interface Story {
  id: string;
  title: string;
  description: string;
  age_range: string;
  estimated_duration: number;
  story_context: string | null;
  created_by: string | null;
  is_public: boolean;
  is_user_generated: boolean;
  generation_status: 'pending' | 'first_chapter_ready' | 'generating' | 'fully_generated' | 'failed' | null;
  generation_progress: number | null;
  language: string | null;
  art_style: string | null;
  narrator_enabled: boolean;
  video_enabled: boolean;
  cover_image_url: string | null;
  image_prompt: string | null;
  likes_count: number;
  dislikes_count: number;
  comment_count: number;
  completion_count: number;
  story_outline: StoryOutline | null;
  story_memory: StoryMemory | null;
  created_at: string;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
}

export interface StoryNode {
  id: string;
  story_id: string;
  node_key: string;
  content: string;
  is_ending: boolean;
  ending_type: string | null;
  sequence_order: number;
  parent_choice_id: string | null;
  image_url: string | null;
  image_prompt: string | null;
  audio_url: string | null;
  video_url: string | null;
  is_placeholder?: boolean;
  created_at: string;
}

export interface StoryChoice {
  id: string;
  from_node_id: string;
  to_node_id: string;
  choice_text: string;
  consequence_hint: string | null;
  choice_order: number;
  is_public: boolean;
  created_by: string | null;
  hint?: string | null;
  to_node?: StoryNode;
}

export interface StoryReaction {
  user_id: string;
  story_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

export interface StoryComment {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

// ============================================
// User Types
// ============================================

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro';
  is_grandfathered: boolean;
  total_points: number;
  reading_points: number;
  creating_points: number;
  stories_generated_today: number;
  last_generation_date: string | null;
  total_stories_generated: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_period_end: string | null;
  created_at: string;
}

export interface SubscriptionUsage {
  isPro: boolean;
  canGenerate: boolean;
  storiesUsedToday: number;
  dailyLimit: number;
  totalStoriesGenerated: number;
  subscriptionTier: 'free' | 'pro';
  isGrandfathered: boolean;
}

export interface UserSubscription {
  subscription_tier: 'free' | 'pro';
  is_grandfathered: boolean;
  total_points: number;
  reading_points: number;
  creating_points: number;
  stripe_customer_id: string | null;
}

// ============================================
// Quest Types
// ============================================

export interface Quest {
  id: string;
  quest_type: string;
  title: string;
  description: string;
  target_count: number;
  points_reward: number;
  current_progress: number;
  completed: boolean;
  completed_at: string | null;
}

export interface QuestStreak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

// ============================================
// API Response Types
// ============================================

export interface GenerateStoryRequest {
  storyContext?: string;
  userChoice?: string;
  previousContent?: string;
  storyTitle?: string;
  userPrompt?: string;
  generateFullStory?: boolean;
  chapterCount?: number;
  storyId?: string;
  useMemory?: boolean;
  language?: string;
}

export interface FullStoryResponse {
  title: string;
  description: string;
  ageRange: string;
  estimatedDuration: number;
  storyContext: string;
  startContent: string;
  initialChoices: { text: string; hint: string }[];
  language?: string;
  styleGuide?: {
    characters: { name: string; description: string }[];
    artStyle: string;
    genre: string;
    tone: string;
    setting: string;
    colorPalette: string[];
    atmosphere: string;
  };
  outline?: StoryOutline;
  initialMemory?: StoryMemory;
  chapterSummary?: string;
}

export interface GenerateImageRequest {
  prompt: string;
  artStyle?: string;
  storyTitle?: string;
  storyDescription?: string;
  styleReference?: string;
  previousPrompt?: string;
  storyId?: string;
  nodeId?: string;
}

export interface GenerateVideoRequest {
  imageUrl: string;
  prompt?: string;
  storyId?: string;
  nodeId?: string;
  resolution?: '480' | '720';
}

