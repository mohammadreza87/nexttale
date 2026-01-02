// Re-export all interactive service functions from shared package
// Note: The shared package must be initialized via supabase.ts before using these

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
} from '@nexttale/shared';
