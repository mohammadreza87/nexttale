// Supabase client
export {
  initSupabase,
  getSupabase,
  getSupabaseUrl,
  getSupabaseAnonKey,
  getShareUrl,
  type SupabaseConfig,
} from './lib/supabase';

// Interactive types
export {
  type ContentType,
  type InteractiveContentType,
  type ContentStyle,
  type InteractiveContent,
  type FeedItem,
  type InteractiveReaction,
  type InteractiveComment,
  type GenerateInteractiveRequest,
  type GenerateInteractiveResponse,
  type CreateInteractiveContentRequest,
  type ContentTypeInfo,
  type FeedFilter,
  CONTENT_TYPE_INFO,
} from './lib/interactiveTypes';

// Interactive service
export {
  generateInteractiveContent,
  createInteractiveContent,
  getInteractiveContent,
  getInteractiveContentPaginated,
  getUserInteractiveContent,
  updateInteractiveContent,
  editInteractiveContentWithPrompt,
  deleteInteractiveContent,
  getInteractiveReaction,
  addInteractiveReaction,
  updateInteractiveReaction,
  removeInteractiveReaction,
  getInteractiveComments,
  addInteractiveComment,
  deleteInteractiveComment,
  updateInteractiveComment,
  trackInteractiveView,
  getInteractiveShareUrl,
} from './lib/interactiveService';

// Components
export {
  InteractiveViewer,
  type InteractiveViewerProps,
} from './components/InteractiveViewer';
