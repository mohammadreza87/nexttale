import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface FileContent {
  path: string;
  content: string;
}

interface GenerateRequest {
  prompt: string;
  currentFiles?: Record<string, string>; // Current project files
  selectedFile?: string; // Currently selected file path
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  hasThreeJs?: boolean; // Whether Three.js is already installed
  isFirstPrompt?: boolean; // Is this the first prompt (need to determine template)?
}

interface GeneratedResponse {
  message: string;
  files: FileContent[];
  explanation: string;
  needsThreeJs?: boolean; // Signal to add Three.js template
}

const SYSTEM_PROMPT = `You are an expert game developer working in Joyixir, an AI-powered game builder.
You're helping users build interactive browser games with the following tech stack:

TECH STACK:
- Vite + React 18
- TypeScript with strict mode
- Tailwind CSS for styling
- shadcn/ui components (Radix primitives)
- React Three Fiber for 3D (when needed)
- Canvas API for 2D games

3D DETECTION:
Analyze the user's request carefully. Set "needsThreeJs": true if ANY of these apply:
- User mentions: 3D, three.js, WebGL, Three, R3F, React Three Fiber
- Game types that are inherently 3D: first-person, third-person, 3D platformer, racing game with 3D graphics
- User asks for: 3D models, 3D objects, 3D scene, 3D environment, 3D characters
- Features like: orbit controls, 3D camera, perspective view, 3D physics

For 2D games (platformers, puzzle, arcade, card games, board games), use Canvas API or DOM-based rendering.
Do NOT use Three.js for simple 2D games - it adds unnecessary complexity.

PROJECT STRUCTURE (Vite + React):
\`\`\`
src/
├── main.tsx              # React entry point (DO NOT MODIFY)
├── App.tsx               # Root component with router
├── index.css             # Global styles (Tailwind)
├── pages/
│   ├── Index.tsx         # Main game page - PUT YOUR GAME HERE
│   └── NotFound.tsx      # 404 page
├── components/
│   ├── ui/               # shadcn/ui components (button, card, input, progress, sonner)
│   └── [feature]/        # Feature-specific components
├── hooks/
│   └── use-toast.ts      # Toast notifications
├── lib/
│   └── utils.ts          # cn() helper for classNames
└── types/
    └── index.ts          # TypeScript types
\`\`\`

CRITICAL: The main game code goes in /src/pages/Index.tsx - this is your primary file.

AVAILABLE IMPORTS:
- '@/components/ui/button' - Button with variants (default, destructive, outline, secondary, ghost, link)
- '@/components/ui/card' - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- '@/components/ui/input' - Input field
- '@/components/ui/progress' - Progress bar
- '@/components/ui/sonner' - Toaster for notifications
- '@/hooks/use-toast' - useToast hook
- '@/lib/utils' - cn() for className merging
- '@react-three/fiber', '@react-three/drei', 'three' - 3D graphics (only if hasThreeJs is true)
- 'lucide-react' - Icons
- 'react-router-dom' - useLocation, Link, useNavigate

DESIGN STYLE:
- Dark theme with purple/violet accent colors
- Use Tailwind classes: bg-gray-900, bg-gray-800, text-white, border-gray-700
- Accent: violet-500, violet-600, fuchsia-500
- Rounded corners: rounded-lg, rounded-xl
- Shadows: shadow-lg, shadow-xl

CRITICAL RULES:
1. Main game logic goes in /src/pages/Index.tsx
2. Use TypeScript with proper types
3. Use Tailwind classes for styling (no inline styles)
4. Keep components small and focused
5. Use the existing UI components from @/components/ui
6. DO NOT modify main.tsx or App.tsx unless absolutely necessary
7. For Canvas games, use useRef and useEffect for the canvas element

RESPONSE FORMAT:
Return ONLY valid JSON with this structure:
{
  "message": "Brief description of what was done",
  "files": [
    {
      "path": "/src/pages/Index.tsx",
      "content": "// Complete file content here"
    }
  ],
  "explanation": "Detailed explanation of changes and next steps",
  "needsThreeJs": false
}

Set "needsThreeJs": true ONLY if the game requires 3D graphics (Three.js/R3F).
For 2D games using Canvas or DOM, set it to false.

IMPORTANT:
- Only include files that need to be created or modified
- Provide COMPLETE file contents, not patches
- Make sure all imports are correct
- Test that the code is syntactically valid
- The main entry point is /src/pages/Index.tsx, NOT /src/app/page.tsx`;

async function callGemini(
  prompt: string,
  currentFiles: Record<string, string>,
  selectedFile: string | undefined,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  apiKey: string,
  hasThreeJs: boolean = false
): Promise<GeneratedResponse> {
  // Build context from current files
  let fileContext = '';
  const importantFiles = [
    '/src/pages/Index.tsx',
    '/src/App.tsx',
    '/src/main.tsx',
    selectedFile,
  ].filter(Boolean);

  for (const filePath of importantFiles) {
    if (filePath && currentFiles[filePath]) {
      fileContext += `\n--- ${filePath} ---\n${currentFiles[filePath]}\n`;
    }
  }

  // Build conversation context
  let conversationContext = '';
  if (conversationHistory.length > 0) {
    conversationContext = '\n\nPREVIOUS CONVERSATION:\n';
    for (const msg of conversationHistory.slice(-5)) {
      conversationContext += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    }
  }

  const threeJsContext = hasThreeJs
    ? 'Three.js/React Three Fiber is ALREADY INSTALLED. You can use @react-three/fiber, @react-three/drei, and three imports.'
    : 'Three.js is NOT installed yet. If this game needs 3D, set needsThreeJs: true and the system will install it.';

  const userPrompt = `${conversationContext}

CURRENT PROJECT FILES:
${fileContext || '(No files available - starting fresh)'}

${selectedFile ? `CURRENTLY SELECTED FILE: ${selectedFile}` : ''}

3D STATUS: ${threeJsContext}

USER REQUEST:
${prompt}

Generate the code changes needed. Return ONLY valid JSON with needsThreeJs boolean.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 32768, // Increased from 16K - Gemini 3 supports up to 65K
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API request failed: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!responseText) {
    throw new Error('Gemini returned empty response');
  }

  // Parse JSON response
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to find JSON in response:', responseText.slice(0, 500));
      throw new Error('Gemini did not return valid JSON');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!parsed.message || !Array.isArray(parsed.files)) {
    throw new Error('Response missing required fields');
  }

  return {
    message: parsed.message,
    files: parsed.files,
    explanation: parsed.explanation || '',
    needsThreeJs: parsed.needsThreeJs === true,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      prompt,
      currentFiles = {},
      selectedFile,
      conversationHistory = [],
      hasThreeJs = false,
    }: GenerateRequest = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating code for user ${user.id}:`, prompt.slice(0, 100));

    const generated = await callGemini(
      prompt,
      currentFiles,
      selectedFile,
      conversationHistory,
      geminiApiKey,
      hasThreeJs
    );

    console.log(`Generated ${generated.files.length} files`);

    return new Response(JSON.stringify(generated), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generation failed:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
