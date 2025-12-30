// Content types supported by the platform
export type ContentType = 'story' | 'game' | 'tool' | 'widget' | 'quiz' | 'visualization' | 'music';

// Interactive content types (excludes story and music which have separate tables)
export type InteractiveContentType = 'game' | 'tool' | 'widget' | 'quiz' | 'visualization';

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
  generation_model: string | null;
  created_by: string | null;
  is_public: boolean | null;
  likes_count: number | null;
  dislikes_count: number | null;
  view_count: number | null;
  share_count: number | null;
  comment_count: number | null;
  tags: string[] | null;
  category: string | null;
  estimated_interaction_time: number | null;
  estimated_duration?: number | null; // Alias for estimated_interaction_time
  created_at: string | null;
  updated_at: string | null;
  html_version?: number | null;
  generation_tokens_used?: number | null;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Unified feed item (can be story or interactive content)
export interface FeedItem {
  id: string;
  title: string;
  description: string | null;
  feed_type: ContentType;
  thumbnail_url: string | null;
  preview_url: string | null;
  created_by: string | null;
  is_public: boolean | null;
  likes_count: number | null;
  dislikes_count: number | null;
  view_count: number | null;
  comment_count: number | null;
  created_at: string | null;
  estimated_duration: number | null;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  // For interactive content
  html_content?: string;
  tags?: string[] | null;
  // For music content
  audio_url?: string;
  lyrics?: string | null;
  genre?: string | null;
  mood?: string | null;
  play_count?: number | null;
  voice_clone?: {
    id: string;
    name: string;
  } | null;
}

// Reaction types
export interface InteractiveReaction {
  id: string;
  user_id: string;
  content_id: string;
  reaction_type: 'like' | 'dislike' | string;
  created_at: string | null;
}

// Comment on interactive content
export interface InteractiveComment {
  id: string;
  content_id: string;
  user_id: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  // Alias for user - used by some components
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Request to generate new interactive content
export interface GenerateInteractiveRequest {
  prompt: string;
  contentType: InteractiveContentType;
  style?: ContentStyle;
  // Base64 encoded image data (without data URL prefix)
  imageData?: string;
  // Image MIME type (e.g., 'image/jpeg', 'image/png')
  imageType?: string;
  // Edit mode fields
  editMode?: boolean;
  existingHtml?: string;
  editPrompt?: string;
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
  content_type: InteractiveContentType;
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

export const CONTENT_TYPE_INFO: Record<InteractiveContentType, ContentTypeInfo> = {
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
