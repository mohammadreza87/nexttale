import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Store the singleton instance
let supabaseInstance: SupabaseClient | null = null;
let configuredUrl: string | null = null;
let configuredAnonKey: string | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Initialize the Supabase client with configuration.
 * Must be called before using getSupabase().
 */
export function initSupabase(config: SupabaseConfig): SupabaseClient {
  if (supabaseInstance && configuredUrl === config.url && configuredAnonKey === config.anonKey) {
    return supabaseInstance;
  }

  if (!config.url || !config.anonKey) {
    throw new Error('Missing Supabase configuration: url and anonKey are required');
  }

  supabaseInstance = createClient(config.url, config.anonKey);
  configuredUrl = config.url;
  configuredAnonKey = config.anonKey;

  return supabaseInstance;
}

/**
 * Get the Supabase client instance.
 * Must call initSupabase() first.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error('Supabase not initialized. Call initSupabase() first.');
  }
  return supabaseInstance;
}

/**
 * Get the configured Supabase URL.
 */
export function getSupabaseUrl(): string {
  if (!configuredUrl) {
    throw new Error('Supabase not initialized. Call initSupabase() first.');
  }
  return configuredUrl;
}

/**
 * Get the configured Supabase anon key.
 */
export function getSupabaseAnonKey(): string {
  if (!configuredAnonKey) {
    throw new Error('Supabase not initialized. Call initSupabase() first.');
  }
  return configuredAnonKey;
}

/**
 * Generate a shareable URL for content.
 */
export function getShareUrl(contentId: string, type: 'story' | 'interactive' = 'story'): string {
  const path = type === 'story' ? `?story=${contentId}` : `/interactive/${contentId}`;
  return `${window.location.origin}${path}`;
}
