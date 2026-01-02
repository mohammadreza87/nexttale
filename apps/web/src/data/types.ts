// Re-export core types from lib/types
export type {
  Story,
  StoryNode,
  StoryChoice,
  StoryReaction,
  UserProfile,
  StoryOutline,
  StoryMemory,
  StoryCharacter,
  ChapterOutline,
} from '../lib/types';

// Paginated result type
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

// Feed item types for optimized queries
export interface StoryFeedItem {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cover_video_url: string | null;
  age_range: string | null;
  likes_count: number;
  dislikes_count: number;
  comment_count: number;
  completion_count: number;
  created_at: string;
  estimated_duration: number | null;
  creator_id: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  generation_status: string | null;
  language: string | null;
}

export interface UnifiedFeedItem {
  id: string;
  title: string;
  description: string | null;
  feed_type: 'story' | 'game' | 'tool' | 'quiz' | 'widget' | 'visualization' | 'music';
  thumbnail_url: string | null;
  preview_url: string | null;
  likes_count: number;
  dislikes_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  created_by: string | null;
  estimated_duration: number | null;
  creator_name: string | null;
  creator_avatar: string | null;
  extra_data: Record<string, unknown> | null;
}

export interface StoryWithMetadata {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cover_video_url: string | null;
  age_range: string | null;
  estimated_duration: number | null;
  story_context: string | null;
  likes_count: number;
  dislikes_count: number;
  comment_count: number;
  completion_count: number;
  created_at: string;
  created_by: string | null;
  is_public: boolean;
  generation_status: string | null;
  generation_progress: number | null;
  language: string | null;
  narrator_enabled: boolean | null;
  video_enabled: boolean | null;
  art_style: string | null;
  creator_name: string | null;
  creator_avatar: string | null;
  total_nodes: number;
  total_choices: number;
}

export interface NodeWithChoices {
  node: {
    id: string;
    story_id: string;
    node_key: string;
    content: string;
    is_ending: boolean | null;
    ending_type: string | null;
    order_index: number | null;
    image_url: string | null;
    image_prompt: string | null;
    audio_url: string | null;
    video_url: string | null;
    created_at: string | null;
  };
  choices: Array<{
    id: string;
    from_node_id: string;
    to_node_id: string;
    choice_text: string;
    consequence_hint: string | null;
    choice_order: number | null;
    to_node: {
      id: string;
      node_key: string;
      content: string;
      is_ending: boolean | null;
    } | null;
  }>;
}

// Filter types
export type FeedFilter =
  | 'all'
  | 'story'
  | 'game'
  | 'tool'
  | 'quiz'
  | 'widget'
  | 'visualization'
  | 'music';
