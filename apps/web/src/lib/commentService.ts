import { supabase } from './supabase';

export interface Comment {
  id: string;
  story_id: string | null;
  user_id: string | null;
  content: string;
  created_at: string | null;
  updated_at: string | null;
  parent_id?: string | null;
  user_profiles?: {
    display_name: string | null;
  };
}

export async function getStoryComments(storyId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('story_comments')
    .select(`*`)
    .eq('story_id', storyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return (data || []) as unknown as Comment[];
}

export async function getCommentCount(storyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('story_comments')
    .select('*', { count: 'exact', head: true })
    .eq('story_id', storyId);

  if (error) {
    console.error('Error fetching comment count:', error);
    return 0;
  }

  return count || 0;
}

export async function addComment(storyId: string, content: string): Promise<Comment | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to comment');
  }

  const { data, error } = await supabase
    .from('story_comments')
    .insert({
      story_id: storyId,
      user_id: user.id,
      content: content.trim(),
    })
    .select(`*`)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data as unknown as Comment;
}

export async function updateComment(commentId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('story_comments')
    .update({ content: content.trim() })
    .eq('id', commentId);

  if (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('story_comments').delete().eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}
