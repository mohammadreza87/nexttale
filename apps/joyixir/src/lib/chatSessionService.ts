import { getSupabase } from '@nexttale/shared';
import type {
  ChatSession,
  CreateChatSessionInput,
  UpdateChatSessionInput,
  ConversationMessage,
} from '../types';

/**
 * Get all chat sessions for a project
 */
export async function getChatSessions(projectId: string): Promise<ChatSession[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('joyixir_chat_sessions')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[getChatSessions] Database error:', error);
    throw new Error(`Failed to fetch chat sessions: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single chat session by ID
 */
export async function getChatSession(id: string): Promise<ChatSession | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('joyixir_chat_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch chat session: ${error.message}`);
  }

  return data;
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  input: CreateChatSessionInput
): Promise<ChatSession> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('joyixir_chat_sessions')
    .insert({
      project_id: input.project_id,
      title: input.title,
      messages: input.messages || [],
    })
    .select()
    .single();

  if (error) {
    console.error('[createChatSession] Database error:', error);
    throw new Error(`Failed to create chat session: ${error.message}`);
  }

  console.log(`[createChatSession] Created session ${data.id} for project ${input.project_id}`);
  return data;
}

/**
 * Update a chat session
 */
export async function updateChatSession(
  id: string,
  input: UpdateChatSessionInput
): Promise<ChatSession> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('joyixir_chat_sessions')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update chat session: ${error.message}`);
  }

  return data;
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('joyixir_chat_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete chat session: ${error.message}`);
  }
}

/**
 * Save messages to a chat session
 */
export async function saveChatSessionMessages(
  id: string,
  messages: ConversationMessage[]
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('joyixir_chat_sessions')
    .update({ messages })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to save chat session messages: ${error.message}`);
  }
}

/**
 * Generate a title from the first user message
 */
export function generateSessionTitle(firstMessage: string): string {
  // Truncate and clean up the message for a title
  const cleaned = firstMessage.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 50) {
    return cleaned;
  }
  return cleaned.substring(0, 47) + '...';
}
