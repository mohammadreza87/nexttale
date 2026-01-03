import { getSupabase, getSupabaseUrl } from '@nexttale/shared';

interface FileContent {
  path: string;
  content: string;
}

export interface GenerateResponse {
  message: string;
  files: FileContent[];
  explanation: string;
  needsThreeJs?: boolean;
}

interface GenerateError {
  error: string;
  message?: string;
}

export interface GenerateRequest {
  prompt: string;
  currentFiles?: Record<string, string>;
  selectedFile?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  hasThreeJs?: boolean;
}

/**
 * Generate code using the Joyixir AI service.
 * This calls the generate-joyixir edge function to modify/create files
 * within the Next.js template structure.
 */
export async function generateCode(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = getSupabaseUrl();
  const response = await fetch(
    `${supabaseUrl}/functions/v1/generate-joyixir`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as GenerateError;
    throw new Error(error.message || error.error || 'Generation failed');
  }

  return data as GenerateResponse;
}

/**
 * Apply generated files to the WebContainer
 */
export async function applyGeneratedFiles(
  files: FileContent[],
  writeFile: (path: string, content: string) => Promise<void>
): Promise<void> {
  for (const file of files) {
    // Ensure path starts with /
    const normalizedPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
    await writeFile(normalizedPath, file.content);
  }
}
