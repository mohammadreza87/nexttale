import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateRequest {
  prompt: string;
  contentType: 'game' | 'tool' | 'widget' | 'quiz' | 'visualization';
  style?: 'modern' | 'playful' | 'minimal' | 'retro';
}

interface GeneratedContent {
  title: string;
  description: string;
  html: string;
  tags: string[];
  estimatedTime: number;
}

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  game: `Create an interactive browser game. Include:
- Game logic with scoring system
- Win/lose conditions with visual feedback
- Restart functionality
- Sound effects using Web Audio API (optional beeps/clicks)
- Touch-friendly controls
Make it engaging, fun, and immediately playable.`,

  tool: `Create a useful utility tool. Include:
- Clear, intuitive interface
- Real-time feedback for user actions
- Input validation with helpful error messages
- Copy/download results functionality where appropriate
Focus on practical functionality and excellent UX.`,

  widget: `Create an interactive widget. Include:
- Visually appealing design
- Self-contained functionality
- Smooth animations
- Immediate interactivity without instructions
Make it delightful and shareable.`,

  quiz: `Create an interactive quiz. Include:
- Multiple questions (at least 5)
- Progress indicator
- Immediate feedback per question
- Final score with performance message
- Restart option
Make it engaging and educational.`,

  visualization: `Create an interactive data visualization or animation. Include:
- Smooth, performant animations
- Interactive elements (hover, click, drag)
- Visually stunning design
- Responsive to user input
Make it captivating and explorable.`,
};

const STYLE_PROMPTS: Record<string, string> = {
  modern:
    'Use modern design: clean lines, subtle shadows, smooth animations, glassmorphism effects, professional color palette',
  playful:
    'Use playful design: bright vibrant colors, bouncy animations, rounded shapes, fun emoji/icons, friendly feel',
  minimal:
    'Use minimal design: lots of whitespace, monochrome or limited colors, essential elements only, elegant typography',
  retro:
    'Use retro design: pixel-style elements, neon colors on dark background, 80s/90s aesthetic, CRT effects optional',
};

async function callClaude(
  prompt: string,
  contentType: string,
  style: string,
  apiKey: string
): Promise<GeneratedContent> {
  const systemPrompt = `You are an expert web developer creating self-contained interactive HTML content.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object with this exact structure:
{
  "title": "Short catchy title (max 50 chars)",
  "description": "One sentence description (max 100 chars)",
  "html": "Complete HTML document as a single string",
  "tags": ["tag1", "tag2", "tag3"],
  "estimatedTime": 5
}

2. The HTML must be a COMPLETE, SELF-CONTAINED document:
   - Start with <!DOCTYPE html>
   - Include <html>, <head>, <body> tags
   - ALL CSS in a <style> tag in <head>
   - ALL JavaScript in a <script> tag at end of <body>
   - NO external dependencies (no CDNs, no imports, no external fonts)
   - Must work offline in a sandboxed iframe

3. SECURITY - The code runs in a restricted sandbox. Do NOT use:
   - window.parent, parent.postMessage, top.location
   - localStorage, sessionStorage, indexedDB
   - fetch(), XMLHttpRequest to external URLs
   - window.open(), navigation away from page
   - document.cookie

4. FIXED FRAME DESIGN (CRITICAL - 1080x1350 pixels, 4:5 aspect ratio):
   - The content will be displayed in a FIXED 1080x1350 frame (scaled to fit screen)
   - Design for exactly 1080px width and 1350px height
   - html, body: width: 1080px, height: 1350px, margin: 0, padding: 0
   - Center all content within this fixed frame
   - Canvas games: Use fixed size that fits within frame (e.g., 800x800 max)
   - Use CSS Grid or Flexbox for layouts, centered in frame
   - Font sizes: 24px-32px for body text, 48px-64px for headers (fixed, not responsive)
   - Touch-friendly: minimum 60px touch targets
   - NO viewport units (vw, vh) - use fixed pixel values
   - Dark theme: #0a0a0a background, #fff text
   - Accent colors: purple #8b5cf6, cyan #22d3ee, pink #ec4899
   - The frame will be scaled down on smaller screens, so design for 1080x1350

5. ${CONTENT_TYPE_PROMPTS[contentType]}

6. STYLE: ${STYLE_PROMPTS[style]}

7. QUALITY:
   - Clean, readable code
   - Proper error handling
   - Smooth 60fps animations
   - Immediate visual feedback for interactions
   - Works without any user instructions

Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: `Create a ${contentType}: ${prompt}`,
        },
      ],
      system: systemPrompt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', errorText);
    throw new Error(`Claude API request failed: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.content?.[0]?.type === 'text' ? data.content[0].text : '';

  if (!responseText) {
    throw new Error('Claude returned empty response');
  }

  // Parse JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to find JSON in response:', responseText.slice(0, 500));
    throw new Error('Claude did not return valid JSON');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Attempted to parse:', jsonMatch[0].slice(0, 500));
    throw new Error('Failed to parse Claude response as JSON');
  }

  if (!parsed.title || !parsed.html) {
    throw new Error('Response missing required fields (title or html)');
  }

  return {
    title: parsed.title || 'Untitled',
    description: parsed.description || '',
    html: parsed.html,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    estimatedTime: typeof parsed.estimatedTime === 'number' ? parsed.estimatedTime : 5,
  };
}

function sanitizeHtml(html: string): string {
  let sanitized = html;

  // Remove attempts to access parent window
  sanitized = sanitized.replace(/window\.parent/gi, 'null');
  sanitized = sanitized.replace(/parent\.postMessage/gi, 'null');
  sanitized = sanitized.replace(/top\.location/gi, 'null');
  sanitized = sanitized.replace(/window\.top/gi, 'null');
  sanitized = sanitized.replace(/parent\.document/gi, 'null');

  // Remove external script sources
  sanitized = sanitized.replace(/<script[^>]*src\s*=\s*["'][^"']*["'][^>]*>/gi, '<script>');

  // Remove external stylesheets
  sanitized = sanitized.replace(/<link[^>]*href\s*=\s*["']https?:\/\/[^"']*["'][^>]*>/gi, '');

  // Remove iframes
  sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');

  // Remove forms with external actions
  sanitized = sanitized.replace(
    /<form[^>]*action\s*=\s*["']https?:\/\/[^"']*["'][^>]*>/gi,
    '<form>'
  );

  return sanitized;
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
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check usage limits
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(
        'subscription_tier, subscription_plan, is_grandfathered, interactive_generated_today, last_generation_date'
      )
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      const hasPro =
        profile.subscription_tier === 'pro' ||
        profile.is_grandfathered ||
        profile.subscription_plan === 'pro' ||
        profile.subscription_plan === 'max';

      if (!hasPro) {
        const today = new Date().toISOString().split('T')[0];
        const todayCount =
          profile.last_generation_date === today ? profile.interactive_generated_today || 0 : 0;

        if (todayCount >= 2) {
          return new Response(
            JSON.stringify({
              error: 'daily_limit_reached',
              message:
                "You've reached your daily limit of 2 creations. Upgrade to Pro for unlimited!",
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'Claude API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, contentType, style = 'modern' }: GenerateRequest = await req.json();

    if (!prompt || !contentType) {
      return new Response(JSON.stringify({ error: 'prompt and contentType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validTypes = ['game', 'tool', 'widget', 'quiz', 'visualization'];
    if (!validTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({
          error: `Invalid contentType. Must be one of: ${validTypes.join(', ')}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Generating ${contentType} for user ${user.id}: "${prompt.slice(0, 100)}"`);

    // Generate content with Claude
    const generated = await callClaude(prompt, contentType, style, anthropicApiKey);

    // Sanitize the HTML
    const sanitizedHtml = sanitizeHtml(generated.html);

    // Update usage counter
    const today = new Date().toISOString().split('T')[0];
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('last_generation_date, interactive_generated_today, total_interactive_generated')
      .eq('id', user.id)
      .maybeSingle();

    const isNewDay = currentProfile?.last_generation_date !== today;
    await supabase
      .from('user_profiles')
      .update({
        interactive_generated_today: isNewDay
          ? 1
          : (currentProfile?.interactive_generated_today || 0) + 1,
        last_generation_date: today,
        total_interactive_generated: (currentProfile?.total_interactive_generated || 0) + 1,
      })
      .eq('id', user.id);

    console.log(`Successfully generated: "${generated.title}"`);

    return new Response(
      JSON.stringify({
        ...generated,
        html: sanitizedHtml,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
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
