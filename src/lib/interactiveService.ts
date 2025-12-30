import { supabase } from './supabase';
import type {
  InteractiveContent,
  InteractiveReaction,
  InteractiveComment,
  CreateInteractiveContentRequest,
  GenerateInteractiveRequest,
  GenerateInteractiveResponse,
  InteractiveContentType,
} from './interactiveTypes';

// ============================================
// GENERATION
// ============================================

export async function generateInteractiveContent(
  request: GenerateInteractiveRequest
): Promise<GenerateInteractiveResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-interactive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));

    if (errorData.error === 'daily_limit_reached') {
      throw new Error('daily_limit_reached');
    }

    throw new Error(errorData.error || 'Failed to generate content');
  }

  return response.json();
}

// ============================================
// CRUD OPERATIONS
// ============================================

export async function createInteractiveContent(
  userId: string,
  data: CreateInteractiveContentRequest
): Promise<InteractiveContent> {
  const { data: content, error } = await supabase
    .from('interactive_content')
    .insert({
      ...data,
      created_by: userId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return content as unknown as InteractiveContent;
}

export async function getInteractiveContent(id: string): Promise<InteractiveContent | null> {
  const { data, error } = await supabase
    .from('interactive_content')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as unknown as InteractiveContent;
}

export async function getInteractiveContentPaginated(
  limit: number = 20,
  offset: number = 0,
  contentType?: InteractiveContentType
): Promise<{ data: InteractiveContent[]; hasMore: boolean }> {
  let query = supabase
    .from('interactive_content')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query;

  if (error) throw error;

  return {
    data: (data || []) as unknown as InteractiveContent[],
    hasMore: (data?.length || 0) === limit + 1,
  };
}

export async function getUserInteractiveContent(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ data: InteractiveContent[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from('interactive_content')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit);

  if (error) throw error;

  return {
    data: (data || []) as unknown as InteractiveContent[],
    hasMore: (data?.length || 0) === limit + 1,
  };
}

export async function updateInteractiveContent(
  id: string,
  updates: Partial<
    Pick<InteractiveContent, 'title' | 'description' | 'is_public' | 'tags' | 'html_content'>
  >
): Promise<InteractiveContent> {
  const { data, error } = await supabase
    .from('interactive_content')
    .update(updates as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as InteractiveContent;
}

export async function editInteractiveContentWithPrompt(
  existingHtml: string,
  editPrompt: string
): Promise<GenerateInteractiveResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-interactive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      editMode: true,
      existingHtml,
      editPrompt,
      prompt: '', // Required by interface but not used in edit mode
      contentType: 'widget', // Required by interface but not used in edit mode
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || 'Failed to edit content');
  }

  return response.json();
}

export async function deleteInteractiveContent(id: string): Promise<void> {
  const { error } = await supabase.from('interactive_content').delete().eq('id', id);

  if (error) throw error;
}

// ============================================
// REACTIONS
// ============================================

export async function getInteractiveReaction(
  userId: string,
  contentId: string
): Promise<InteractiveReaction | null> {
  const { data, error } = await supabase
    .from('interactive_reactions')
    .select('*')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle();

  if (error) throw error;
  return data as InteractiveReaction | null;
}

export async function addInteractiveReaction(
  userId: string,
  contentId: string,
  reactionType: 'like' | 'dislike'
): Promise<InteractiveReaction> {
  const { data, error } = await supabase
    .from('interactive_reactions')
    .insert({
      user_id: userId,
      content_id: contentId,
      reaction_type: reactionType,
    })
    .select()
    .single();

  if (error) throw error;
  return data as InteractiveReaction;
}

export async function updateInteractiveReaction(
  userId: string,
  contentId: string,
  reactionType: 'like' | 'dislike'
): Promise<InteractiveReaction> {
  const { data, error } = await supabase
    .from('interactive_reactions')
    .update({ reaction_type: reactionType })
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .select()
    .single();

  if (error) throw error;
  return data as InteractiveReaction;
}

export async function removeInteractiveReaction(userId: string, contentId: string): Promise<void> {
  const { error } = await supabase
    .from('interactive_reactions')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId);

  if (error) throw error;
}

// ============================================
// COMMENTS
// ============================================

export async function getInteractiveComments(contentId: string): Promise<InteractiveComment[]> {
  const { data, error } = await supabase
    .from('interactive_comments')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as InteractiveComment[];
}

export async function addInteractiveComment(
  userId: string,
  contentId: string,
  commentContent: string
): Promise<InteractiveComment> {
  const { data, error } = await supabase
    .from('interactive_comments')
    .insert({
      user_id: userId,
      content_id: contentId,
      content: commentContent,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as InteractiveComment;
}

export async function deleteInteractiveComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('interactive_comments').delete().eq('id', commentId);

  if (error) throw error;
}

export async function updateInteractiveComment(commentId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('interactive_comments')
    .update({ content })
    .eq('id', commentId);

  if (error) throw error;
}

// ============================================
// VIEW TRACKING
// ============================================

export async function trackInteractiveView(
  contentId: string,
  userId?: string,
  sessionId?: string
): Promise<void> {
  await supabase.from('interactive_views').insert({
    content_id: contentId,
    user_id: userId || null,
    session_id: sessionId || null,
  });
}

// ============================================
// SHARE
// ============================================

export function getInteractiveShareUrl(contentId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/interactive/${contentId}`;
}
