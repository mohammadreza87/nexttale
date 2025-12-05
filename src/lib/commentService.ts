import { supabase } from './supabase';

export interface Comment {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    display_name: string | null;
  };
}

export async function getStoryComments(storyId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('story_comments')
    .select(`
      *,
      user_profiles!story_comments_user_id_fkey_profiles (
        display_name
      )
    `)
    .eq('story_id', storyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  return data || [];
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
  const { data: { user } } = await supabase.auth.getUser();

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
    .select(`
      *,
      user_profiles!story_comments_user_id_fkey_profiles (
        display_name
      )
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return data;
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
  const { error } = await supabase
    .from('story_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}
