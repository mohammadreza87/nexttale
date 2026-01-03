import { getSupabase } from '@nexttale/shared';

export interface UserSettings {
  id: string;
  user_id: string;

  // Profile settings
  username: string | null;
  display_name: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  hide_profile_picture: boolean;

  // Studio settings
  studio_name: string;
  studio_description: string | null;

  // Preferences
  chat_suggestions: boolean;
  generation_sound: 'first' | 'always' | 'never';

  // Labs features
  labs_github_branch_switching: boolean;

  // Connected accounts
  connected_accounts: {
    google?: { email: string; connected_at: string };
    github?: { username: string; connected_at: string };
  };

  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsInput {
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  location?: string | null;
  website_url?: string | null;
  hide_profile_picture?: boolean;
  studio_name?: string;
  studio_description?: string | null;
  chat_suggestions?: boolean;
  generation_sound?: 'first' | 'always' | 'never';
  labs_github_branch_switching?: boolean;
  connected_accounts?: UserSettings['connected_accounts'];
}

/**
 * Get user settings (creates default if doesn't exist)
 */
export async function getUserSettings(): Promise<UserSettings> {
  const supabase = getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Try to get existing settings
  const { data, error } = await supabase
    .from('joyixir_user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  // If no settings exist, create default
  if (!data) {
    const { data: newSettings, error: insertError } = await supabase
      .from('joyixir_user_settings')
      .insert({
        user_id: user.id,
        display_name: user.user_metadata?.full_name || null,
        studio_name: 'My Studio',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create settings: ${insertError.message}`);
    }

    return newSettings as UserSettings;
  }

  return data as UserSettings;
}

/**
 * Update user settings
 */
export async function updateUserSettings(input: UpdateSettingsInput): Promise<UserSettings> {
  const supabase = getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('joyixir_user_settings')
    .update(input)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  return data as UserSettings;
}

/**
 * Connect GitHub account
 */
export async function connectGitHub(): Promise<void> {
  const supabase = getSupabase();

  await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/settings/github`,
      scopes: 'repo read:user',
    },
  });
}

/**
 * Disconnect GitHub account
 */
export async function disconnectGitHub(): Promise<UserSettings> {
  const supabase = getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get current settings
  const settings = await getUserSettings();

  // Remove GitHub from connected accounts - create new object without github key
  const currentAccounts = settings.connected_accounts || {};
  const remainingAccounts: typeof currentAccounts = {};
  for (const [key, value] of Object.entries(currentAccounts)) {
    if (key !== 'github') {
      remainingAccounts[key as keyof typeof currentAccounts] = value;
    }
  }

  return updateUserSettings({
    connected_accounts: remainingAccounts,
  });
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const supabase = getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('joyixir_user_settings')
    .select('id')
    .eq('username', username)
    .neq('user_id', user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // No match found = username is available
    return true;
  }

  return !data;
}

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<void> {
  const supabase = getSupabase();

  // Note: This requires a server-side function to fully delete user
  // For now, we just sign out the user
  // In production, you'd call a secure edge function that deletes all user data

  await supabase.auth.signOut();
}

/**
 * Get usage statistics for the current user
 */
export async function getUsageStats(): Promise<{
  projectsCount: number;
  creditsUsed: number;
  creditsRemaining: number;
  currentStreak: number;
}> {
  const supabase = getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Get projects count
  const { count: projectsCount } = await supabase
    .from('joyixir_projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // For now, return mock data for credits (would integrate with billing system)
  return {
    projectsCount: projectsCount || 0,
    creditsUsed: 2,
    creditsRemaining: 3,
    currentStreak: 1,
  };
}
