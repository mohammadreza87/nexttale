// Music style options
export type MusicStyle = 'song' | 'poem' | 'rap' | 'spoken_word';

// Voice clone from database
export interface VoiceClone {
  id: string;
  user_id: string | null;
  name: string;
  voice_id: string; // ElevenLabs voice ID
  description: string | null;
  sample_url: string | null;
  is_default: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// Music content from database
export interface MusicContent {
  id: string;
  title: string;
  description: string | null;
  lyrics: string | null;
  audio_url: string;
  duration: number | null;
  genre: string | null;
  mood: string | null;
  voice_clone_id: string | null;
  generation_prompt: string | null;
  created_by: string | null;
  is_public: boolean | null;
  likes_count: number | null;
  dislikes_count: number | null;
  play_count: number | null;
  share_count: number | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  voice_clone?: {
    name: string;
  } | null;
}

// Music reaction
export interface MusicReaction {
  id: string;
  user_id: string;
  music_id: string;
  reaction_type: string; // 'like' | 'dislike'
  created_at: string | null;
}

// Request to clone voice
export interface CloneVoiceRequest {
  name: string;
  description?: string;
  audioBase64: string;
  audioType: string;
}

// Response from clone-voice function
export interface CloneVoiceResponse {
  success: boolean;
  voiceClone: {
    id: string;
    name: string;
    voiceId: string;
    description: string | null;
  };
}

// Request to generate music
export interface GenerateMusicRequest {
  prompt: string;
  genre?: string;
  mood?: string;
  instrumental?: boolean;
  durationSeconds?: number;
  voiceType?: 'random-female' | 'random-male' | string; // string for voice clone ID
}

// Response from generate-music function
export interface GenerateMusicResponse {
  success: boolean;
  music: MusicContent;
}

// Genre options
export const GENRE_OPTIONS = [
  'pop',
  'rock',
  'hip-hop',
  'r&b',
  'jazz',
  'classical',
  'electronic',
  'country',
  'folk',
  'indie',
  'latin',
  'soul',
] as const;

// Mood options
export const MOOD_OPTIONS = [
  'uplifting',
  'melancholic',
  'energetic',
  'calm',
  'romantic',
  'angry',
  'nostalgic',
  'hopeful',
  'mysterious',
  'playful',
] as const;

// Style info for UI
export const MUSIC_STYLE_INFO: Record<
  MusicStyle,
  { label: string; description: string; icon: string }
> = {
  song: {
    label: 'Song',
    description: 'Melodic lyrics with verses and chorus',
    icon: 'Music',
  },
  poem: {
    label: 'Poem',
    description: 'Poetic piece with rhythm and imagery',
    icon: 'Feather',
  },
  rap: {
    label: 'Rap',
    description: 'Hip-hop style with bars and flow',
    icon: 'Mic2',
  },
  spoken_word: {
    label: 'Spoken Word',
    description: 'Powerful spoken piece with emotion',
    icon: 'MessageSquare',
  },
};
