import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateMusicRequest {
  prompt: string;
  voiceCloneId?: string;
  genre?: string;
  mood?: string;
  style?: 'song' | 'poem' | 'rap' | 'spoken_word';
}

interface GeneratedMusic {
  title: string;
  description: string;
  lyrics: string;
  genre: string;
  mood: string;
  tags: string[];
}

async function generateLyricsWithGemini(
  prompt: string,
  style: string,
  genre: string,
  mood: string,
  apiKey: string
): Promise<GeneratedMusic> {
  const styleGuide = {
    song: 'Write lyrics for a song with verses and a chorus. Make it melodic and singable.',
    poem: 'Write a poetic piece with rhythm and flow. Use vivid imagery and emotions.',
    rap: 'Write rap lyrics with strong rhythm, rhymes, and flow. Include bars and verses.',
    spoken_word: 'Write a spoken word piece with powerful delivery and emotional depth.',
  };

  const systemPrompt = `You are a talented songwriter and lyricist. Create original content based on the user's request.

STYLE: ${styleGuide[style as keyof typeof styleGuide] || styleGuide.song}
GENRE: ${genre || 'pop'}
MOOD: ${mood || 'uplifting'}

Return ONLY a valid JSON object:
{
  "title": "Catchy title for the piece",
  "description": "One sentence description",
  "lyrics": "The full lyrics/text (use \\n for line breaks)",
  "genre": "${genre || 'pop'}",
  "mood": "${mood || 'uplifting'}",
  "tags": ["tag1", "tag2", "tag3"]
}

GUIDELINES:
- Keep lyrics concise (30-60 seconds when spoken/sung)
- Make it personal and emotional
- Use natural language that sounds good when spoken aloud
- Include rhythm and flow appropriate for the style

Return ONLY the JSON object. No markdown, no explanation.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nCreate content about: ${prompt}` }] }],
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
      throw new Error('Failed to parse lyrics response');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  return parsed;
}

async function generateAudioWithElevenLabs(
  text: string,
  voiceId: string,
  apiKey: string,
  style: string
): Promise<ArrayBuffer> {
  // Adjust voice settings based on style
  const voiceSettings = {
    song: { stability: 0.3, similarity_boost: 0.8, style: 0.5 },
    poem: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
    rap: { stability: 0.2, similarity_boost: 0.85, style: 0.7 },
    spoken_word: { stability: 0.4, similarity_boost: 0.8, style: 0.4 },
  };

  const settings = voiceSettings[style as keyof typeof voiceSettings] || voiceSettings.spoken_word;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs TTS error:', errorText);
    throw new Error(`ElevenLabs TTS failed: ${response.status}`);
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
      voiceCloneId,
      genre = 'pop',
      mood = 'uplifting',
      style = 'spoken_word',
    }: GenerateMusicRequest = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get voice ID - use cloned voice or default
    let voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Default voice (Sarah)

    if (voiceCloneId) {
      const { data: voiceClone } = await supabase
        .from('voice_clones')
        .select('voice_id')
        .eq('id', voiceCloneId)
        .eq('user_id', user.id)
        .single();

      if (voiceClone) {
        voiceId = voiceClone.voice_id;
      }
    }

    console.log(`Generating music for user ${user.id}: "${prompt.slice(0, 50)}"`);

    // Step 1: Generate lyrics with Gemini
    console.log('Generating lyrics...');
    const musicContent = await generateLyricsWithGemini(prompt, style, genre, mood, geminiApiKey);
    console.log(`Lyrics generated: "${musicContent.title}"`);

    // Step 2: Generate audio with ElevenLabs
    console.log('Generating audio...');
    const audioBuffer = await generateAudioWithElevenLabs(
      musicContent.lyrics,
      voiceId,
      elevenLabsApiKey,
      style
    );
    console.log(`Audio generated: ${audioBuffer.byteLength} bytes`);

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
        title: musicContent.title,
        description: musicContent.description,
        lyrics: musicContent.lyrics,
        audio_url: urlData.publicUrl,
        genre: musicContent.genre,
        mood: musicContent.mood,
        voice_clone_id: voiceCloneId || null,
        generation_prompt: prompt,
        created_by: user.id,
        is_public: !hasPro ? true : true, // Default to public
        tags: musicContent.tags,
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
