import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import {
  type StoryOutline,
  type StoryMemory,
  initializeMemoryFromOutline,
  buildStoryContextPrompt,
  updateMemory,
} from '../_shared/storyTypes.ts';
import {
  datadog,
  withLLMTrace,
  createLogger,
} from '../_shared/datadog.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DEFAULT_GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3-pro-preview';
const MAX_RETRIES = 1;

// Datadog logger for this function
const log = createLogger('generate-story');

async function callGemini(
  prompt: string,
  apiKey: string,
  {
    model = DEFAULT_GEMINI_MODEL,
    temperature = 0.6,
    maxOutputTokens = 1024,
    responseMimeType = 'text/plain',
  }: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  } = {},
  traceContext?: { operation?: string; storyId?: string; userId?: string }
): Promise<string> {
  const operation = traceContext?.operation || 'gemini-call';

  // Use Datadog tracing wrapper for observability
  return withLLMTrace(
    'gemini',
    operation,
    async () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens,
            responseMimeType,
            // Disable thinking mode for faster responses and lower token usage
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        log.error('Gemini API error', { status: response.status, error: errorText });
        throw new Error(`Gemini request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Log the response structure for debugging
      log.info('Gemini response received', { candidates: data?.candidates?.length || 0 });

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: any) => part?.text || '')
          .join('')
          .trim() || '';

      if (!text) {
        log.error('No text in Gemini response', {
          response_preview: JSON.stringify(data, null, 2).slice(0, 500),
        });
        throw new Error('Gemini returned no content');
      }

      log.info('Gemini text generated', { length: text.length });
      return text;
    },
    {
      prompt,
      model,
      temperature,
      maxTokens: maxOutputTokens,
      storyId: traceContext?.storyId,
      userId: traceContext?.userId,
    }
  );
}

interface StoryRequest {
  storyContext?: string;
  userChoice?: string;
  previousContent?: string;
  storyTitle?: string;
  userPrompt?: string;
  generateFullStory?: boolean;
  chapterCount?: number;
  // New fields for memory-based generation
  storyId?: string;
  useMemory?: boolean;
  language?: string;
}

interface GeneratedStory {
  content: string;
  choices: {
    text: string;
    hint: string;
  }[];
  isEnding: boolean;
  endingType?: string;
  chapterSummary?: string;
  memoryUpdates?: {
    keyEvents?: { event: string; importance: 'critical' | 'major' | 'minor' }[];
    resolvedThreads?: string[];
    newLocation?: string;
    newConflict?: string;
  };
}

async function detectLanguageWithLLM(
  text: string | undefined,
  geminiApiKey: string,
  fallback: string = 'en'
): Promise<string> {
  if (!text || !text.trim()) return fallback;
  try {
    const content = await callGemini(
      `Detect the language of this text. Respond ONLY with the ISO 639-1 code (like en, es, fr). If unsure, reply with "en".\n\nText:\n${text.slice(0, 800)}`,
      geminiApiKey,
      { temperature: 0, maxOutputTokens: 8 }
    );

    const code = content.trim().toLowerCase();
    if (/^[a-z]{2}$/.test(code)) return code;
    return fallback;
  } catch (err) {
    console.warn('Language detect error, falling back', err);
    return fallback;
  }
}

interface FullStoryData {
  title: string;
  description: string;
  ageRange: string;
  estimatedDuration: number;
  storyContext: string;
  startContent: string;
  initialChoices: {
    text: string;
    hint: string;
  }[];
  language?: string;
  styleGuide?: any;
  // New: Full story outline and initial memory
  outline?: StoryOutline;
  initialMemory?: StoryMemory;
  chapterSummary?: string;
}

function cleanJsonString(raw: string): string {
  return raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

function parseJsonSafe(raw: string, label: string): any {
  if (!raw || typeof raw !== 'string') {
    console.error(`[parseJsonSafe] Invalid input for ${label}: raw is ${typeof raw}`);
    throw new Error(`Failed to parse ${label} JSON: empty or invalid input`);
  }

  console.log(`[parseJsonSafe] Parsing ${label}, raw length: ${raw.length}`);
  console.log(`[parseJsonSafe] Raw content (first 500 chars): ${raw.slice(0, 500)}`);

  const cleaned = cleanJsonString(raw);

  // Attempt 1: Try parsing directly first (works if model returns clean JSON)
  try {
    const result = JSON.parse(cleaned);
    console.log(`[parseJsonSafe] Direct parse succeeded for ${label}`);
    return result;
  } catch (err1) {
    console.log(`[parseJsonSafe] Direct parse failed for ${label}:`, (err1 as Error).message);
  }

  // Attempt 2: Extract JSON object using regex (greedy)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const result = JSON.parse(jsonMatch[0]);
      console.log(`[parseJsonSafe] Regex match parse succeeded for ${label}`);
      return result;
    } catch (err2) {
      console.log(
        `[parseJsonSafe] Regex match parse failed for ${label}:`,
        (err2 as Error).message
      );
    }
  }

  // Attempt 3: Try to find JSON by looking for opening brace and matching closing brace
  const braceIndex = cleaned.indexOf('{');
  if (braceIndex !== -1) {
    const fromBrace = cleaned.slice(braceIndex);
    let depth = 0;
    let endIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < fromBrace.length; i++) {
      const char = fromBrace[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') depth--;
        if (depth === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }

    if (endIndex > 0) {
      const extracted = fromBrace.slice(0, endIndex);
      try {
        const result = JSON.parse(extracted);
        console.log(`[parseJsonSafe] Brace extraction parse succeeded for ${label}`);
        return result;
      } catch (err3) {
        console.log(
          `[parseJsonSafe] Brace extraction parse failed for ${label}:`,
          (err3 as Error).message
        );

        // Attempt 4: Try fixing common issues and parse again
        try {
          const fixed = extracted
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            // eslint-disable-next-line no-control-regex
            .replace(/[\x00-\x1f\x7f]/g, (match) => {
              // Keep valid whitespace, replace others with space
              if (match === '\n' || match === '\r' || match === '\t') return match;
              return ' ';
            })
            .replace(/"\s*\n\s*"/g, '" "') // Fix broken strings across lines
            .replace(/([^\\])"/g, '$1"') // Normalize quotes
            .replace(/\\'/g, "'"); // Unescape single quotes
          const result = JSON.parse(fixed);
          console.log(`[parseJsonSafe] Fixed parse succeeded for ${label}`);
          return result;
        } catch (err4) {
          console.log(`[parseJsonSafe] Fixed parse failed for ${label}:`, (err4 as Error).message);
        }
      }
    }
  }

  // Attempt 5: Try parsing with a more aggressive cleanup
  try {
    // Remove any non-JSON content before and after
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonOnly = raw.slice(jsonStart, jsonEnd + 1);
      // Aggressive cleanup
      const aggressiveCleaned = jsonOnly
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x1f\x7f]/g, ' ') // Remove all control characters
        .trim();
      const result = JSON.parse(aggressiveCleaned);
      console.log(`[parseJsonSafe] Aggressive cleanup parse succeeded for ${label}`);
      return result;
    }
  } catch (err5) {
    console.log(
      `[parseJsonSafe] Aggressive cleanup parse failed for ${label}:`,
      (err5 as Error).message
    );
  }

  // Log the raw content for debugging
  console.error(`[parseJsonSafe] All parse attempts failed for ${label}`);
  console.error(`[parseJsonSafe] Raw content (full): ${raw}`);

  throw new Error(`Failed to parse ${label} JSON`);
}

/**
 * Generate a complete story outline with character details and chapter structure
 */
async function generateStoryOutline(
  userPrompt: string,
  geminiApiKey: string,
  language: string = 'en'
): Promise<{ outline: StoryOutline; title: string; description: string }> {
  const outlinePrompt = `Create an engaging adult interactive fiction outline (5-7 chapters).

User's story idea: "${userPrompt}"

RESPOND ONLY IN LANGUAGE CODE: ${language || 'en'} (do not switch languages).

Create a complete story structure with 5-7 chapters. This is for adult readers (18+) - include complex themes, moral dilemmas, and nuanced characters. Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "Compelling, intriguing title",
  "description": "1-2 sentence hook that captures the story's tension or mystery",
  "outline": {
    "premise": "Core story premise with stakes and conflict",
    "theme": "Main theme (redemption, betrayal, justice, love, survival, identity, power, truth, etc.)",
    "genre": "Primary genre (thriller, romance, mystery, fantasy, sci-fi, drama, horror, etc.)",
    "tone": "Story tone (dark, suspenseful, romantic, mysterious, gritty, atmospheric, etc.)",
    "setting": {
      "location": "Primary location with rich, atmospheric details",
      "timePeriod": "When the story takes place (era, year, or time context)",
      "timeOfDay": "Opening scene time",
      "atmosphere": "Mood and visual atmosphere - evocative and immersive",
      "consistentElements": ["element1", "element2", "element3"]
    },
    "characters": [
      {
        "name": "Character name",
        "role": "protagonist/antagonist/love_interest/ally/mysterious_figure",
        "age": "specific age (e.g., 32)",
        "appearance": "DETAILED physical description - hair, eyes, build, distinguishing features, expression",
        "clothing": "SPECIFIC attire that reflects personality and situation",
        "personality": "3-4 personality traits with depth and flaws",
        "motivation": "What drives them - desires, fears, secrets",
        "goal": "What they want to achieve and why it matters"
      }
    ],
    "plotThreads": [
      {
        "id": "thread_1",
        "description": "Main conflict, mystery, or driving question",
        "introducedInChapter": 1,
        "stakes": "What happens if this isn't resolved"
      }
    ],
    "chapters": [
      {
        "chapterNumber": 1,
        "title": "Evocative chapter title",
        "keyEvent": "THE specific event that MUST happen",
        "conflict": "Problem, tension, or dilemma",
        "emotionalBeat": "How reader should feel (tension, intrigue, desire, fear, hope)",
        "endState": "Cliffhanger or decision point",
        "mustReference": ["thread_1"]
      }
    ],
    "resolution": "How the main conflict can resolve (multiple possible endings)",
    "totalChapters": 6
  }
}

CONTENT GUIDELINES:
- Complex, morally gray characters with realistic motivations
- Tension, suspense, and emotional depth
- Meaningful choices with real consequences
- No explicit sexual content or graphic violence
- Mature themes handled with sophistication
- Multiple possible endings based on reader choices

CRITICAL: Return ONLY the JSON object. No explanations, no markdown code blocks.`;

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[generateStoryOutline] Attempt ${attempt + 1}/${maxRetries + 1}`);

      const outlineText = await callGemini(
        `${outlinePrompt}\n\nCreate outline for: ${userPrompt}`,
        geminiApiKey,
        {
          temperature: attempt === 0 ? 0.6 : 0.4,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        }
      );

      console.log(`[generateStoryOutline] Raw response length: ${outlineText.length}`);
      console.log(
        `[generateStoryOutline] Raw response (first 1000 chars): ${outlineText.slice(0, 1000)}`
      );

      const parsed = parseJsonSafe(outlineText, 'outline');

      // Validate the parsed data has required fields
      if (!parsed.outline || !parsed.title) {
        throw new Error('Parsed outline missing required fields (outline or title)');
      }

      return {
        outline: parsed.outline,
        title: parsed.title,
        description: parsed.description || 'An exciting adventure awaits!',
      };
    } catch (error) {
      console.error(`[generateStoryOutline] Attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to generate story outline after retries');
}

/**
 * Generate the first chapter using the outline
 */
async function generateFirstChapter(
  outline: StoryOutline,
  memory: StoryMemory,
  geminiApiKey: string,
  language: string = 'en'
): Promise<{ content: string; choices: { text: string; hint: string }[]; chapterSummary: string }> {
  const contextPrompt = buildStoryContextPrompt(memory, outline, 1);

  const systemPrompt = `You are an adult fiction writer creating immersive interactive stories. Write ONLY in language: ${language || 'en'}.

${contextPrompt}

Write the FIRST CHAPTER of this story. Rules:
1. Open with atmosphere and tension - draw the reader in immediately
2. Introduce the protagonist with their EXACT appearance from the outline within the first few paragraphs
3. Establish the setting with rich, sensory details
4. Hint at the central conflict or mystery
5. Write 3-4 paragraphs (8-12 sentences) with literary quality
6. Use sophisticated vocabulary appropriate for adult readers
7. End with a compelling moment that demands a choice
8. No explicit sexual content or graphic violence

Return ONLY valid JSON:
{
  "content": "The chapter text with atmospheric prose and vivid character descriptions",
  "choices": [
    {"text": "A meaningful choice with consequences", "hint": "What this path might lead to"},
    {"text": "An alternative that changes the story direction", "hint": "Different consequences"}
  ],
  "chapterSummary": "One sentence summary of key events and emotional beat"
}`;

  let parsed: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const content = await callGemini(
      `${systemPrompt}\n\nWrite chapter 1 following the outline exactly.`,
      geminiApiKey,
      {
        temperature: attempt === 0 ? 0.5 : 0.35,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      }
    );

    parsed = parseJsonSafe(content, 'first chapter');

    const hasChoices = parsed?.choices && parsed.choices.length >= 2;
    if (parsed?.content && parsed?.chapterSummary && hasChoices) {
      break;
    }

    if (attempt === MAX_RETRIES) {
      throw new Error('Failed to generate a valid first chapter (choices/summary missing)');
    }
  }

  return parsed;
}

/**
 * Generate a continuation chapter using memory and outline
 */
function buildContinuationContext(
  outline: StoryOutline,
  memory: StoryMemory,
  userChoice: string,
  previousContent: string,
  targetChapter: number
): string {
  const recentEvents = memory.keyEvents
    .slice(-3)
    .map((e) => `Ch${e.chapter}: ${e.event}`)
    .join('; ');

  const unresolved = memory.unresolvedThreads.map((t) => t.description).join('; ');
  const chapterOutline = outline.chapters[targetChapter - 1];

  return `
STATE TO RESPECT:
- Current location: ${memory.setting.currentLocation}
- Current conflict: ${memory.currentConflict}
- Unresolved threads: ${unresolved || 'None'}
- Recent key events: ${recentEvents || 'Story just began'}

READER CHOICE (must be acknowledged in the opening): "${userChoice}"

CHAPTER GOAL:
- Target chapter: ${targetChapter}/${outline.totalChapters}
- Key event: ${chapterOutline?.keyEvent || 'Continue the main conflict'}
- Chapter conflict: ${chapterOutline?.conflict || memory.currentConflict}
- Emotional beat: ${chapterOutline?.emotionalBeat || 'Build tension'}
- End state: ${chapterOutline?.endState || 'Lead naturally to next chapter'}

PRIOR TEXT (trimmed): ${previousContent.slice(-800)}
`.trim();
}

async function generateContinuationChapter(
  outline: StoryOutline,
  memory: StoryMemory,
  userChoice: string,
  previousContent: string,
  chapterCount: number,
  geminiApiKey: string,
  language: string = 'en'
): Promise<GeneratedStory> {
  const targetChapter = chapterCount + 1;
  const contextPrompt = buildStoryContextPrompt(memory, outline, targetChapter);
  const continuityContext = buildContinuationContext(
    outline,
    memory,
    userChoice,
    previousContent,
    targetChapter
  );

  const shouldEnd = targetChapter >= outline.totalChapters;
  const isNearEnd = targetChapter >= outline.totalChapters - 1;

  const systemPrompt = `You are an adult fiction writer creating immersive interactive stories. Write ONLY in language: ${language || 'en'}.

${contextPrompt}
${continuityContext}

${
  shouldEnd
    ? `THIS IS THE FINAL CHAPTER. You MUST:
- Resolve the main conflict: ${memory.currentConflict}
- Wrap up all unresolved threads with meaningful conclusions
- Deliver a satisfying ending that reflects the reader's choices
- The ending can be happy, bittersweet, tragic, or ambiguous based on the story
- Set isEnding=true and endingType appropriately
- Return empty choices array`
    : isNearEnd
      ? `This is near the end. Build toward the climax and start resolving major threads.`
      : `Continue building tension and developing the story toward its climax.`
}

CRITICAL RULES:
1. Characters must MATCH their established appearances and personalities EXACTLY
2. First paragraph MUST acknowledge and react to the reader's choice meaningfully
3. Maintain narrative consistency with established events and locations
4. Write 3-4 paragraphs (8-12 sentences) with literary quality
5. Mature themes are fine - no explicit sexual content or graphic violence
6. Consequences of choices should feel real and impactful
${!shouldEnd ? '7. Provide 2 meaningful choices that genuinely affect the story direction' : ''}

Return ONLY valid JSON:
{
  "content": "Chapter text that directly follows from the choice with emotional depth",
  "choices": ${shouldEnd ? '[]' : '[{"text": "Choice 1 with real stakes", "hint": "Consequence"}, {"text": "Choice 2 that diverges meaningfully", "hint": "Different consequence"}]'},
  "isEnding": ${shouldEnd},
  "endingType": ${shouldEnd ? '"satisfying"' : 'null'},
  "chapterSummary": "One sentence summary of key events and emotional impact",
  "memoryUpdates": {
    "keyEvents": [{"event": "Main event of this chapter", "importance": "major"}],
    "resolvedThreads": [],
    "newLocation": null,
    "newConflict": null
  }
}`;

  let parsed: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const content = await callGemini(
      `${systemPrompt}\n\nWrite chapter ${targetChapter} based on the reader's choice.`,
      geminiApiKey,
      {
        temperature: attempt === 0 ? 0.55 : 0.4,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      }
    );

    parsed = parseJsonSafe(content, 'continuation chapter');

    // Enforce endings and choices
    if (shouldEnd) {
      parsed.isEnding = true;
      parsed.endingType = parsed.endingType || 'happy';
      parsed.choices = [];
    } else if (!parsed.isEnding && (!parsed.choices || parsed.choices.length < 2)) {
      if (attempt === MAX_RETRIES) {
        throw new Error('Non-ending chapter must have at least 2 choices');
      }
      continue;
    }

    if (parsed?.content) break;
  }

  // Enforce ending if we're at max chapters
  if (targetChapter >= outline.totalChapters && !parsed.isEnding) {
    parsed.isEnding = true;
    parsed.endingType = parsed.endingType || 'happy';
    parsed.choices = [];
  }

  // Ensure non-ending chapters have choices
  if (!parsed.isEnding && (!parsed.choices || parsed.choices.length < 2)) {
    throw new Error('Non-ending chapter must have at least 2 choices');
  }

  return parsed;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const requestStartTime = Date.now();

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

    const {
      storyContext,
      userChoice,
      previousContent,
      storyTitle,
      userPrompt,
      generateFullStory,
      chapterCount,
      storyId,
      useMemory,
      language,
    }: StoryRequest = await req.json();

    // Check usage limits for full story generation
    if (generateFullStory) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select(
          'subscription_tier, is_grandfathered, stories_generated_today, last_generation_date'
        )
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        const hasPro = profile.subscription_tier === 'pro' || profile.is_grandfathered;
        if (!hasPro) {
          const today = new Date().toISOString().split('T')[0];
          const todayCount =
            profile.last_generation_date === today ? profile.stories_generated_today : 0;
          if (todayCount >= 2) {
            return new Response(
              JSON.stringify({
                error: 'daily_limit_reached',
                message:
                  "You've reached your daily limit of 2 stories. Upgrade to Pro for unlimited stories!",
              }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // FULL STORY GENERATION (with outline)
    // ============================================
    if (generateFullStory && userPrompt) {
      console.log('Generating full story with outline for:', userPrompt);

      // Generate the complete story outline
      const detectedLanguage =
        language ?? (await detectLanguageWithLLM(userPrompt, geminiApiKey, 'en'));
      const { outline, title, description } = await generateStoryOutline(
        userPrompt,
        geminiApiKey,
        detectedLanguage
      );

      // Initialize memory from outline
      const initialMemory = initializeMemoryFromOutline(outline);

      // Generate first chapter using outline
      const firstChapter = await generateFirstChapter(
        outline,
        initialMemory,
        geminiApiKey,
        detectedLanguage
      );

      // Validate choices
      if (!firstChapter.choices || firstChapter.choices.length < 2) {
        throw new Error('First chapter must have at least 2 choices');
      }

      // Update usage counter
      const today = new Date().toISOString().split('T')[0];
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('last_generation_date, stories_generated_today, total_stories_generated')
        .eq('id', user.id)
        .maybeSingle();

      const isNewDay = currentProfile?.last_generation_date !== today;
      await supabase
        .from('user_profiles')
        .update({
          stories_generated_today: isNewDay
            ? 1
            : (currentProfile?.stories_generated_today || 0) + 1,
          last_generation_date: today,
          total_stories_generated: (currentProfile?.total_stories_generated || 0) + 1,
        })
        .eq('id', user.id);

      // Create style guide for images
      const styleGuide = {
        characters: outline.characters.map((c) => ({
          name: c.name,
          description: `${c.appearance}, wearing ${c.clothing}`,
        })),
        artStyle: 'Cinematic, photorealistic, dramatic lighting',
        genre: (outline as any).genre || 'drama',
        tone: (outline as any).tone || 'atmospheric',
        setting: outline.setting.location,
        colorPalette: outline.setting.consistentElements,
        atmosphere: outline.setting.atmosphere,
      };

      const response: FullStoryData = {
        title,
        description,
        ageRange: '18+',
        estimatedDuration: outline.totalChapters * 4,
        storyContext: outline.premise,
        startContent: firstChapter.content,
        initialChoices: firstChapter.choices.slice(0, 3),
        language: detectedLanguage,
        styleGuide,
        outline,
        initialMemory: {
          ...initialMemory,
          currentChapter: 1,
          keyEvents: [
            {
              chapter: 1,
              event: firstChapter.chapterSummary,
              importance: 'major',
            },
          ],
        },
        chapterSummary: firstChapter.chapterSummary,
      };

      // Track successful full story generation
      const durationMs = Date.now() - requestStartTime;
      log.info('Full story generated successfully', {
        title,
        duration_ms: durationMs,
        chapters: outline.totalChapters,
        user_id: user.id,
      });
      await datadog.trackRequest('generate-story', durationMs, true, [
        'type:full_story',
        `language:${detectedLanguage}`,
      ]);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // CONTINUATION GENERATION (with memory)
    // ============================================
    if (storyId && useMemory && userChoice) {
      console.log('Generating continuation with memory for story:', storyId);

      // Fetch story with outline and memory
      const { data: story } = await supabase
        .from('stories')
        .select('story_outline, story_memory, title, language')
        .eq('id', storyId)
        .single();

      if (!story?.story_outline || !story?.story_memory) {
        // Fall back to legacy generation if no memory
        console.log('No memory found, falling back to legacy generation');
      } else {
        const outline = story.story_outline as StoryOutline;
        const memory = story.story_memory as StoryMemory;
        const storyLanguage = (story as any).language || language || 'en';

        const result = await generateContinuationChapter(
          outline,
          memory,
          userChoice,
          previousContent || '',
          chapterCount || memory.currentChapter,
          geminiApiKey,
          storyLanguage
        );

        // Update memory with new chapter info
        const updatedMemory = updateMemory(
          memory,
          result.memoryUpdates || {},
          (chapterCount || memory.currentChapter) + 1
        );

        // Add key event for this chapter
        if (result.chapterSummary) {
          updatedMemory.keyEvents.push({
            chapter: updatedMemory.currentChapter,
            event: result.chapterSummary,
            importance: 'major',
          });
        }

        // Save updated memory to database
        await supabase.from('stories').update({ story_memory: updatedMemory }).eq('id', storyId);

        // Track successful continuation generation
        const durationMs = Date.now() - requestStartTime;
        log.info('Continuation generated successfully', {
          story_id: storyId,
          chapter: updatedMemory.currentChapter,
          is_ending: result.isEnding,
          duration_ms: durationMs,
        });
        await datadog.trackRequest('generate-story', durationMs, true, [
          'type:continuation',
          `chapter:${updatedMemory.currentChapter}`,
          `is_ending:${result.isEnding}`,
        ]);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ============================================
    // LEGACY GENERATION (backward compatibility)
    // ============================================
    if (!storyContext && !userPrompt) {
      return new Response(JSON.stringify({ error: 'Story context or user prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentChapter = chapterCount || 0;
    const minimumChapters = 4;
    const maximumChapters = 7;
    const shouldPreventEnding = currentChapter < minimumChapters;
    const mustEnd = currentChapter >= maximumChapters;
    const shouldEncourageEnding = currentChapter >= 5;

    const detectedLanguage =
      language ??
      (await detectLanguageWithLLM(
        userPrompt || storyContext || previousContent,
        geminiApiKey,
        'en'
      ));

    const systemPrompt = `Adult fiction writer for immersive interactive stories (18+). Write ONLY in language: ${detectedLanguage}.

Rules:
- Sophisticated prose with atmospheric descriptions and emotional depth
- 3-4 paragraphs (8-12 sentences)
- Stories should be ${minimumChapters}-${maximumChapters} chapters for satisfying narrative arc
- ${shouldPreventEnding ? `Chapter ${currentChapter + 1}: Build tension. Provide 2 meaningful choices.` : mustEnd ? `Chapter ${currentChapter + 1}: FINAL CHAPTER. Resolve conflicts satisfyingly. Set isEnding=true, provide endingType, set choices=[]` : shouldEncourageEnding ? `Chapter ${currentChapter + 1}: Build toward climax. Start resolving threads.` : `Continue developing the story with rising stakes.`}
- Endings: satisfying/bittersweet/tragic/ambiguous/triumphant
- If ending: choices = []
- No explicit sexual content or graphic violence
- Mature themes handled with sophistication

Return ONLY JSON:
{
  "content": "Story text (3-4 paragraphs with literary quality)",
  "choices": [{"text": "Choice 1", "hint": "Hint"}],
  "isEnding": false,
  "endingType": null
}`;

    let actualUserPrompt;
    if (userChoice && previousContent) {
      const trimmedPrevious = (previousContent || '').slice(-1200);
      actualUserPrompt = `Title: ${storyTitle || 'Adventure'}

Previous (trimmed):
${trimmedPrevious}

Chosen: "${userChoice}"

Continue ONLY in language: ${detectedLanguage}.`;
    } else {
      const trimmedContext = (storyContext || '').slice(0, 1200);
      actualUserPrompt = `Theme: ${trimmedContext}

Create opening with 2-3 choices in language: ${detectedLanguage}.`;
    }

    const content = await callGemini(`${systemPrompt}\n\n${actualUserPrompt}`, geminiApiKey, {
      temperature: 0.55,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    });

    const storyData = parseJsonSafe(content, 'legacy story');

    // Force ending at max chapters
    if (mustEnd && !storyData.isEnding) {
      storyData.isEnding = true;
      storyData.endingType = storyData.endingType || 'happy';
      storyData.choices = [];
    }

    // Validate non-ending has choices
    if (!storyData.isEnding && (!storyData.choices || storyData.choices.length < 2)) {
      throw new Error('Non-ending story must have at least 2 choices');
    }

    // Track successful legacy generation
    const durationMs = Date.now() - requestStartTime;
    log.info('Legacy story generated successfully', {
      chapter: currentChapter + 1,
      is_ending: storyData.isEnding,
      duration_ms: durationMs,
    });
    await datadog.trackRequest('generate-story', durationMs, true, [
      'type:legacy',
      `chapter:${currentChapter + 1}`,
      `is_ending:${storyData.isEnding}`,
    ]);

    return new Response(JSON.stringify(storyData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const durationMs = Date.now() - requestStartTime;
    log.error('Request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: durationMs,
    });

    // Track failed request
    await datadog.trackRequest('generate-story', durationMs, false, ['error:true']);

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
