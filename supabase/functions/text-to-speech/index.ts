import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TTSRequest {
  text: string;
  nodeId?: string;
  voice?: string;
  speed?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, nodeId, voice }: TTSRequest = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    const defaultVoiceId = Deno.env.get("ELEVENLABS_VOICE_ID");
    const modelId = Deno.env.get("ELEVENLABS_MODEL_ID") || "eleven_turbo_v2";

    if (!elevenLabsApiKey) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trimmedVoice = voice?.trim();
    const looksLikeId = trimmedVoice ? trimmedVoice.length > 12 || trimmedVoice.includes("-") : false;
    const voiceId = looksLikeId ? trimmedVoice : defaultVoiceId || trimmedVoice;
    if (!voiceId) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs voice ID is required (pass voice or set ELEVENLABS_VOICE_ID)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Starting ElevenLabs TTS request for text length:', text.length);
    console.log('Voice ID:', voiceId);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.7,
        },
        output_format: "mp3_44100_128",
      }),
    });

    console.log('ElevenLabs TTS API response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs TTS API error:', response.status, error);

      return new Response(
        JSON.stringify({
          error: "Failed to generate speech",
          details: error,
          status: response.status,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Successfully received audio from ElevenLabs');
    const audioBuffer = await response.arrayBuffer();
    console.log('Audio buffer size:', audioBuffer.byteLength);

    if (nodeId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const fileName = `${nodeId}-${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from("story-images")
        .upload(fileName, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("story-images")
          .getPublicUrl(fileName);

        await supabase
          .from("story_nodes")
          .update({ audio_url: urlData.publicUrl })
          .eq("id", nodeId);

        return new Response(
          JSON.stringify({
            success: true,
            audioUrl: urlData.publicUrl,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const uint8Array = new Uint8Array(audioBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Audio = btoa(binaryString);

    return new Response(
      JSON.stringify({
        audio: base64Audio,
        contentType: "audio/mpeg",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        stack: errorStack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
