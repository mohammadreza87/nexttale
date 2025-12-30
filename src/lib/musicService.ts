import { supabase } from './supabase';
import type {
  VoiceClone,
  MusicContent,
  MusicReaction,
  CloneVoiceRequest,
  CloneVoiceResponse,
  GenerateMusicRequest,
  GenerateMusicResponse,
} from './musicTypes';

// Get user's voice clones
export async function getUserVoiceClones(userId: string): Promise<VoiceClone[]> {
  const { data, error } = await supabase
    .from('voice_clones')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Clone a voice
export async function cloneVoice(request: CloneVoiceRequest): Promise<CloneVoiceResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clone-voice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to clone voice');
  }

  return data;
}

// Delete a voice clone
export async function deleteVoiceClone(voiceCloneId: string): Promise<void> {
  const { error } = await supabase.from('voice_clones').delete().eq('id', voiceCloneId);

  if (error) throw error;
}

// Generate music
export async function generateMusic(request: GenerateMusicRequest): Promise<GenerateMusicResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-music`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to generate music');
  }

  return data;
}

// Get user's music
export async function getUserMusic(userId: string): Promise<MusicContent[]> {
  const { data, error } = await supabase
    .from('music_content')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as MusicContent[];
}

// Get public music feed
export async function getMusicFeed(options?: {
  limit?: number;
  offset?: number;
  genre?: string;
  mood?: string;
}): Promise<MusicContent[]> {
  let query = supabase
    .from('music_content')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (options?.genre) {
    query = query.eq('genre', options.genre);
  }

  if (options?.mood) {
    query = query.eq('mood', options.mood);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as MusicContent[];
}

// Get single music content
export async function getMusicById(musicId: string): Promise<MusicContent | null> {
  const { data, error } = await supabase
    .from('music_content')
    .select('*')
    .eq('id', musicId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as MusicContent;
}

// Update music
export async function updateMusic(
  musicId: string,
  updates: Partial<Pick<MusicContent, 'title' | 'description' | 'is_public' | 'tags'>>
): Promise<MusicContent> {
  const { data, error } = await supabase
    .from('music_content')
    .update(updates)
    .eq('id', musicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete music
export async function deleteMusic(musicId: string): Promise<void> {
  const { error } = await supabase.from('music_content').delete().eq('id', musicId);

  if (error) throw error;
}

// Get user's reaction to music
export async function getUserMusicReaction(
  userId: string,
  musicId: string
): Promise<MusicReaction | null> {
  const { data, error } = await supabase
    .from('music_reactions')
    .select('*')
    .eq('user_id', userId)
    .eq('music_id', musicId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Add or update reaction
export async function setMusicReaction(
  musicId: string,
  reactionType: 'like' | 'dislike'
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await supabase.from('music_reactions').upsert(
    {
      user_id: user.user.id,
      music_id: musicId,
      reaction_type: reactionType,
    },
    { onConflict: 'user_id,music_id' }
  );

  if (error) throw error;
}

// Remove reaction
export async function removeMusicReaction(musicId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('music_reactions')
    .delete()
    .eq('user_id', user.user.id)
    .eq('music_id', musicId);

  if (error) throw error;
}

// Increment play count
export async function incrementPlayCount(musicId: string): Promise<void> {
  // Get current play count and increment it
  const { data } = await supabase
    .from('music_content')
    .select('play_count')
    .eq('id', musicId)
    .single();

  const currentCount = data?.play_count ?? 0;

  await supabase
    .from('music_content')
    .update({ play_count: currentCount + 1 })
    .eq('id', musicId);
}
