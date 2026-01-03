/**
 * Feedback Service
 * Handles feedback submission to Supabase
 */

import { getSupabase } from '@nexttale/shared';

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';

export interface FeedbackInput {
  type: FeedbackType;
  title: string;
  description: string;
  pageUrl?: string;
}

export interface Feedback extends FeedbackInput {
  id: string;
  user_id: string;
  user_agent: string;
  created_at: string;
}

/**
 * Submit feedback to the database
 */
export async function submitFeedback(input: FeedbackInput): Promise<Feedback> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to submit feedback');
  }

  const feedbackData = {
    user_id: user.id,
    type: input.type,
    title: input.title,
    description: input.description,
    page_url: input.pageUrl || window.location.href,
    user_agent: navigator.userAgent,
  };

  const { data, error } = await supabase
    .from('feedback')
    .insert(feedbackData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Feedback;
}

/**
 * Get user's feedback history
 */
export async function getUserFeedback(): Promise<Feedback[]> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch feedback:', error);
    return [];
  }

  return data as Feedback[];
}
