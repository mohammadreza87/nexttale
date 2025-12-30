import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CloneVoiceRequest {
  name: string;
  description?: string;
  audioBase64: string; // Base64 encoded audio file
  audioType: string; // MIME type e.g., 'audio/wav', 'audio/mp3'
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

    // Check if user already has voice clones (limit for free users)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_plan, is_grandfathered, voice_clones_count')
      .eq('id', user.id)
      .maybeSingle();

    const hasPro =
      profile?.subscription_tier === 'pro' ||
      profile?.is_grandfathered ||
      profile?.subscription_plan === 'pro' ||
      profile?.subscription_plan === 'max';

    // Free users can only have 1 voice clone
    if (!hasPro && (profile?.voice_clones_count || 0) >= 1) {
      return new Response(
        JSON.stringify({
          error: 'voice_limit_reached',
          message: 'Free users can only have 1 voice clone. Upgrade to Pro for unlimited!',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      return new Response(JSON.stringify({ error: 'ElevenLabs API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, description, audioBase64, audioType }: CloneVoiceRequest = await req.json();

    if (!name || !audioBase64) {
      return new Response(JSON.stringify({ error: 'name and audioBase64 are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Cloning voice for user ${user.id}: "${name}"`);

    // Convert base64 to blob for ElevenLabs API
    const audioBuffer = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: audioType || 'audio/wav' });

    // Create FormData for ElevenLabs API
    const formData = new FormData();
    formData.append('name', `${name}_${user.id.slice(0, 8)}`);
    formData.append('description', description || `Voice clone for ${name}`);
    formData.append('files', audioBlob, 'voice_sample.wav');

    // Call ElevenLabs Voice Cloning API (Instant Voice Cloning)
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'voice_cloning_failed',
          message: 'Failed to clone voice. Please try with a clearer audio sample.',
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const voiceData = await response.json();
    console.log(`Voice cloned successfully: ${voiceData.voice_id}`);

    // Save voice clone to database
    const { data: voiceClone, error: dbError } = await supabase
      .from('voice_clones')
      .insert({
        user_id: user.id,
        name: name,
        voice_id: voiceData.voice_id,
        description: description || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to delete the voice from ElevenLabs if DB save failed
      await fetch(`https://api.elevenlabs.io/v1/voices/${voiceData.voice_id}`, {
        method: 'DELETE',
        headers: { 'xi-api-key': elevenLabsApiKey },
      });
      throw dbError;
    }

    // Update voice clones count
    await supabase
      .from('user_profiles')
      .update({ voice_clones_count: (profile?.voice_clones_count || 0) + 1 })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        voiceClone: {
          id: voiceClone.id,
          name: voiceClone.name,
          voiceId: voiceClone.voice_id,
          description: voiceClone.description,
        },
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
