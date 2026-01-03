/**
 * Shared TypeScript types for Joyixir
 * All types should be defined here to avoid circular dependencies
 */

// ============================================================================
// File System Types
// ============================================================================

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
}

// ============================================================================
// Chat Types
// ============================================================================

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp?: Date;
  files?: FileContent[];
}

export interface ConversationMessage {
  role: ChatRole;
  content: string;
}

// ============================================================================
// Project Types
// ============================================================================

export type ProjectStatus = 'draft' | 'building' | 'ready' | 'published';

export interface JoyixirProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  has_three_js: boolean;
  status: ProjectStatus;
  files: Record<string, string>;
  conversation: ConversationMessage[];
  created_at: string;
  updated_at: string;
  last_opened_at: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  has_three_js?: boolean;
  status?: ProjectStatus;
  files?: Record<string, string>;
  conversation?: ConversationMessage[];
}

// ============================================================================
// Settings Types
// ============================================================================

export type GenerationSoundOption = 'first' | 'always' | 'never';

export interface ConnectedAccounts {
  google?: { email: string; connected_at: string };
  github?: { username: string; connected_at: string };
}

export interface UserSettings {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  hide_profile_picture: boolean;
  studio_name: string;
  studio_description: string | null;
  chat_suggestions: boolean;
  generation_sound: GenerationSoundOption;
  labs_github_branch_switching: boolean;
  connected_accounts: ConnectedAccounts;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsInput {
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  location?: string | null;
  website_url?: string | null;
  hide_profile_picture?: boolean;
  studio_name?: string;
  studio_description?: string | null;
  chat_suggestions?: boolean;
  generation_sound?: GenerationSoundOption;
  labs_github_branch_switching?: boolean;
  connected_accounts?: ConnectedAccounts;
}

// ============================================================================
// Usage & Stats Types
// ============================================================================

export interface UsageStats {
  projectsCount: number;
  creditsUsed: number;
  creditsRemaining: number;
  totalCredits: number;
  currentStreak: number;
  dailyAverage: number;
  daysEdited: number;
}

// ============================================================================
// WebContainer Types
// ============================================================================

export type WebContainerStatus =
  | 'idle'
  | 'booting'
  | 'ready'
  | 'installing'
  | 'running'
  | 'error';

// ============================================================================
// AI Generation Types
// ============================================================================

export interface GenerateCodeRequest {
  prompt: string;
  conversationHistory?: ConversationMessage[];
  currentFile?: string;
  currentFileContent?: string;
  hasThreeJs?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerateCodeResponse {
  message: string;
  files: GeneratedFile[];
  explanation: string;
  needsThreeJs?: boolean;
}

// ============================================================================
// Template Types
// ============================================================================

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  category: 'arcade' | 'puzzle' | 'platformer' | '3d' | 'casual' | 'strategy';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

// ============================================================================
// UI Types
// ============================================================================

export type SettingsTab =
  | 'studio'
  | 'plans'
  | 'usage'
  | 'account'
  | 'labs'
  | 'github';

export type ViewMode = 'grid' | 'list';

export type NavItem =
  | 'home'
  | 'search'
  | 'projects'
  | 'starred'
  | 'shared'
  | 'discover'
  | 'templates'
  | 'learn';
