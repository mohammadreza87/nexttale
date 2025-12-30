import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateMusicRequest {
  prompt: string;
  genre?: string;
  mood?: string;
  instrumental?: boolean;
  durationSeconds?: number; // 3-600 seconds
  voiceType?: 'random-female' | 'random-male' | string; // string for voice clone ID
}

interface GeneratedMusicPlan {
  title: string;
  description: string;
  musicPrompt: string; // The prompt for ElevenLabs Music API
  lyrics: string | null; // Lyrics if not instrumental
  genre: string;
  mood: string;
  tags: string[];
}

async function generateMusicPlanWithGemini(
  prompt: string,
  genre: string,
  mood: string,
  instrumental: boolean,
  voiceType: string | undefined,
  apiKey: string
): Promise<GeneratedMusicPlan> {
  // Determine voice description for the prompt
  let voiceDescription = '';
  if (!instrumental && voiceType) {
    if (voiceType === 'random-female') {
      voiceDescription = 'VOICE: Female vocalist with clear, expressive vocals';
    } else if (voiceType === 'random-male') {
      voiceDescription = 'VOICE: Male vocalist with strong, emotive vocals';
    } else {
      // Voice clone - use generic description since Music API doesn't support custom voices
      voiceDescription = 'VOICE: Natural singing voice with emotional delivery';
    }
  }

  const systemPrompt = `You are a music producer creating a prompt for an AI music generation system.

USER REQUEST: ${prompt}
GENRE: ${genre}
MOOD: ${mood}
INSTRUMENTAL: ${instrumental ? 'Yes - no vocals' : 'No - include vocals with lyrics'}
${voiceDescription}

Create a detailed music generation prompt following these best practices:
1. Use abstract mood descriptors OR detailed musical language
2. Include tempo (BPM), musical key if relevant
3. Specify instruments clearly (e.g., "solo piano", "acoustic guitar")
4. For vocals, write actual lyrics that fit the mood and theme
5. Keep the song around 60-90 seconds

Return ONLY a valid JSON object:
{
  "title": "Catchy title for the song",
  "description": "One sentence description of the song",
  "musicPrompt": "The complete prompt for music generation - include style, tempo, instruments, mood, and ${instrumental ? 'specify instrumental only' : 'include the full lyrics in the prompt'}",
  "lyrics": ${instrumental ? 'null' : '"Full lyrics with verse/chorus structure using line breaks"'},
  "genre": "${genre}",
  "mood": "${mood}",
  "tags": ["tag1", "tag2", "tag3"]
}

IMPORTANT for musicPrompt:
- Be specific about instruments and style
- ${instrumental ? 'Add "instrumental only" or "no vocals" to the prompt' : 'Include lyrics directly in the prompt, formatted naturally'}
- Include tempo hints like "upbeat 120 BPM" or "slow ballad"
- Describe the emotional journey of the song

Return ONLY the JSON object. No markdown, no explanation.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.8,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API failed: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!responseText) {
    throw new Error('Gemini returned empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse music plan response');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  return parsed;
}

async function generateMusicWithElevenLabs(
  musicPrompt: string,
  instrumental: boolean,
  durationMs: number,
  apiKey: string
): Promise<ArrayBuffer> {
  console.log('Calling ElevenLabs Music API...');
  console.log('Prompt:', musicPrompt.slice(0, 200) + '...');
  console.log('Duration:', durationMs, 'ms');
  console.log('Instrumental:', instrumental);

  const response = await fetch('https://api.elevenlabs.io/v1/music', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      prompt: musicPrompt,
      music_length_ms: durationMs,
      model_id: 'music_v1',
      force_instrumental: instrumental,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs Music API error:', response.status, errorText);

    // Parse error for better messages
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.detail?.status === 'bad_prompt') {
        throw new Error(
          `Music generation blocked: ${errorJson.detail.message}. Suggestion: ${errorJson.detail.suggestion || 'Try a different prompt'}`
        );
      }
      throw new Error(
        errorJson.detail?.message || `ElevenLabs Music API failed: ${response.status}`
      );
    } catch (e) {
      if (e instanceof Error && e.message.includes('Music generation blocked')) {
        throw e;
      }
      throw new Error(`ElevenLabs Music API failed: ${response.status} - ${errorText}`);
    }
  }

  return response.arrayBuffer();
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    // Check usage limits
    const { data: profile } = await supabase
      .from('user_profiles')
      .select(
        'subscription_tier, subscription_plan, is_grandfathered, music_generated_today, last_generation_date'
      )
      .eq('id', user.id)
      .maybeSingle();

    const hasPro =
      profile?.subscription_tier === 'pro' ||
      profile?.is_grandfathered ||
      profile?.subscription_plan === 'pro' ||
      profile?.subscription_plan === 'max';

    if (!hasPro) {
      const today = new Date().toISOString().split('T')[0];
      const todayCount =
        profile?.last_generation_date === today ? profile?.music_generated_today || 0 : 0;
      if (todayCount >= 2) {
        return new Response(
          JSON.stringify({
            error: 'daily_limit_reached',
            message:
              "You've reached your daily limit of 2 music creations. Upgrade to Pro for unlimited!",
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!geminiApiKey || !elevenLabsApiKey) {
      return new Response(JSON.stringify({ error: 'API keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      prompt,
      genre = 'pop',
      mood = 'uplifting',
      instrumental = false,
      durationSeconds = 60,
      voiceType,
    }: GenerateMusicRequest = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate duration (3-600 seconds, ElevenLabs limit)
    const validDuration = Math.min(Math.max(durationSeconds, 3), 600);
    const durationMs = validDuration * 1000;

    console.log(`Generating music for user ${user.id}: "${prompt.slice(0, 50)}"`);

    // Step 1: Generate music plan with Gemini
    console.log('Generating music plan...');
    const musicPlan = await generateMusicPlanWithGemini(
      prompt,
      genre,
      mood,
      instrumental,
      voiceType,
      geminiApiKey
    );
    console.log(`Music plan generated: "${musicPlan.title}"`);

    // Step 2: Generate actual music with ElevenLabs Music API
    console.log('Generating music audio...');
    const audioBuffer = await generateMusicWithElevenLabs(
      musicPlan.musicPrompt,
      instrumental,
      durationMs,
      elevenLabsApiKey
    );
    console.log(`Music generated: ${audioBuffer.byteLength} bytes`);

    // Step 3: Upload audio to storage
    const fileName = `music/${user.id}/${Date.now()}.mp3`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('story-images')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload audio');
    }

    const { data: urlData } = supabaseAdmin.storage.from('story-images').getPublicUrl(fileName);

    // Step 4: Save to database
    const { data: savedMusic, error: dbError } = await supabase
      .from('music_content')
      .insert({
        title: musicPlan.title,
        description: musicPlan.description,
        lyrics: musicPlan.lyrics,
        audio_url: urlData.publicUrl,
        duration: validDuration,
        genre: musicPlan.genre,
        mood: musicPlan.mood,
        generation_prompt: prompt,
        created_by: user.id,
        is_public: true,
        tags: musicPlan.tags,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Update usage counter
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = profile?.last_generation_date !== today;
    await supabase
      .from('user_profiles')
      .update({
        music_generated_today: isNewDay ? 1 : (profile?.music_generated_today || 0) + 1,
        last_generation_date: today,
        total_music_generated: (profile?.total_music_generated || 0) + 1,
      })
      .eq('id', user.id);

    console.log(`Music saved: ${savedMusic.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        music: savedMusic,
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
