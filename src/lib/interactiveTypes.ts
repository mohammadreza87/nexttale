// Content types supported by the platform
export type ContentType = 'story' | 'game' | 'tool' | 'widget' | 'quiz' | 'visualization';

// Style options for content generation
export type ContentStyle = 'modern' | 'playful' | 'minimal' | 'retro';

// Interactive content from database
export interface InteractiveContent {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  thumbnail_url: string | null;
  preview_gif_url: string | null;
  html_content: string;
  generation_prompt: string;
  generation_model: string;
  created_by: string | null;
  is_public: boolean;
  likes_count: number;
  dislikes_count: number;
  view_count: number;
  share_count: number;
  comment_count: number;
  tags: string[];
  category: string | null;
  estimated_interaction_time: number;
  created_at: string;
  updated_at: string;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Unified feed item (can be story or interactive content)
export interface FeedItem {
  id: string;
  title: string;
  description: string;
  feed_type: ContentType;
  thumbnail_url: string | null;
  preview_url: string | null;
  created_by: string | null;
  is_public: boolean;
  likes_count: number;
  dislikes_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
  estimated_duration: number;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  // For interactive content
  html_content?: string;
  tags?: string[];
}

// Reaction types
export interface InteractiveReaction {
  id: string;
  user_id: string;
  content_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

// Comment on interactive content
export interface InteractiveComment {
  id: string;
  content_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Request to generate new interactive content
export interface GenerateInteractiveRequest {
  prompt: string;
  contentType: Exclude<ContentType, 'story'>;
  style?: ContentStyle;
}

// Response from generate-interactive edge function
export interface GenerateInteractiveResponse {
  title: string;
  description: string;
  html: string;
  tags: string[];
  estimatedTime: number;
}

// Create interactive content request
export interface CreateInteractiveContentRequest {
  title: string;
  description: string;
  content_type: Exclude<ContentType, 'story'>;
  html_content: string;
  generation_prompt: string;
  tags?: string[];
  is_public?: boolean;
  estimated_interaction_time?: number;
}

// Content type metadata for UI
export interface ContentTypeInfo {
  type: ContentType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const CONTENT_TYPE_INFO: Record<Exclude<ContentType, 'story'>, ContentTypeInfo> = {
  game: {
    type: 'game',
    label: 'Game',
    icon: 'Gamepad2',
    description: 'Interactive games like puzzles, arcade, and more',
    color: 'text-green-400',
  },
  tool: {
    type: 'tool',
    label: 'Tool',
    icon: 'Wrench',
    description: 'Useful utilities like calculators and converters',
    color: 'text-blue-400',
  },
  widget: {
    type: 'widget',
    label: 'Widget',
    icon: 'LayoutGrid',
    description: 'Mini apps like clocks, counters, and displays',
    color: 'text-purple-400',
  },
  quiz: {
    type: 'quiz',
    label: 'Quiz',
    icon: 'HelpCircle',
    description: 'Interactive quizzes and trivia',
    color: 'text-yellow-400',
  },
  visualization: {
    type: 'visualization',
    label: 'Visualization',
    icon: 'BarChart3',
    description: 'Data visualizations and animations',
    color: 'text-pink-400',
  },
};

// Filter options for feed
export type FeedFilter = ContentType | 'all';
