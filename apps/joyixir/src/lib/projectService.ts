import { getSupabase } from '@nexttale/shared';

export interface JoyixirProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  has_three_js: boolean;
  status: 'draft' | 'building' | 'ready' | 'published';
  files: Record<string, string>;
  conversation: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  has_three_js?: boolean;
  status?: JoyixirProject['status'];
  files?: Record<string, string>;
  conversation?: JoyixirProject['conversation'];
}

/**
 * Get all projects for the current user
 */
export async function getProjects(): Promise<JoyixirProject[]> {
  const supabase = getSupabase();

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[getProjects] Auth error:', authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }
  if (!user) {
    console.warn('[getProjects] No authenticated user');
    return [];
  }

  const { data, error } = await supabase
    .from('joyixir_projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[getProjects] Database error:', error);
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  console.log(`[getProjects] Found ${data?.length || 0} projects for user ${user.id}`);
  return data || [];
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<JoyixirProject | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('joyixir_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  // Update last_opened_at
  await supabase
    .from('joyixir_projects')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', id);

  return data;
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput): Promise<JoyixirProject> {
  const supabase = getSupabase();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error('[createProject] Auth error:', authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }
  if (!user) {
    console.error('[createProject] No authenticated user');
    throw new Error('Not authenticated');
  }

  console.log(`[createProject] Creating project "${input.name}" for user ${user.id}`);

  const { data, error } = await supabase
    .from('joyixir_projects')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      has_three_js: false,
      status: 'draft',
      files: {},
      conversation: [],
    })
    .select()
    .single();

  if (error) {
    console.error('[createProject] Database error:', error);
    throw new Error(`Failed to create project: ${error.message}`);
  }

  console.log(`[createProject] Successfully created project ${data.id}`);
  return data;
}

/**
 * Update a project
 */
export async function updateProject(id: string, input: UpdateProjectInput): Promise<JoyixirProject> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('joyixir_projects')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return data;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('joyixir_projects')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

/**
 * Save project files (debounced save for auto-save)
 */
export async function saveProjectFiles(
  id: string,
  files: Record<string, string>
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('joyixir_projects')
    .update({ files })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to save files: ${error.message}`);
  }
}

/**
 * Save project conversation
 */
export async function saveProjectConversation(
  id: string,
  conversation: JoyixirProject['conversation']
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('joyixir_projects')
    .update({ conversation })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to save conversation: ${error.message}`);
  }
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  id: string,
  status: JoyixirProject['status']
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('joyixir_projects')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }
}
