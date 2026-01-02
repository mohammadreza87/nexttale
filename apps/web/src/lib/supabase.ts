import { initSupabase, getSupabase, getShareUrl as getShareUrlBase } from '@nexttale/shared';

// Initialize Supabase with Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize the shared Supabase client
initSupabase({ url: supabaseUrl, anonKey: supabaseAnonKey });

// Export the client for use in this app
export const supabase = getSupabase();

// Re-export utility function
export function getShareUrl(storyId: string): string {
  return getShareUrlBase(storyId, 'story');
}
