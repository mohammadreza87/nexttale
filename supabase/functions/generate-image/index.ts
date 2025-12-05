import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { StoryOutline, StoryMemory } from "../_shared/storyTypes.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImageRequest {
  prompt: string;
  artStyle?: string;
  storyTitle?: string;
  storyDescription?: string;
  styleReference?: string;
  previousPrompt?: string;
  storyId?: string;
  nodeId?: string;
}

// All styles are cinematic with adult fiction aesthetic
const artStyleDescriptions: Record<string, string> = {
  cinematic: "cinematic film still, dramatic lighting, shallow depth of field, professional cinematography, movie scene quality, atmospheric mood, adult drama aesthetic",
  noir: "cinematic film noir style, high contrast black and white with selective color, dramatic shadows, moody atmosphere, 1940s detective movie aesthetic, sultry and mysterious",
  realistic: "cinematic photorealistic digital art, lifelike proportions, natural skin textures, dramatic cinematic lighting, detailed environments, movie-quality realism, adult characters",
  fantasy: "cinematic fantasy illustration, epic scale, dramatic lighting, enchanted atmosphere with warm glow, movie poster quality, adult fantasy aesthetic",
  anime: "cinematic anime style, expressive characters, dramatic composition, vibrant colors with cinematic lighting, adult anime aesthetic, detailed character designs",
  "graphic-novel": "cinematic graphic novel style, bold dramatic compositions, noir-influenced shadows, dynamic panel-worthy scenes, adult comic aesthetic",
  "concept-art": "cinematic concept art, professional film production quality, dramatic atmosphere, detailed environments, adult fiction aesthetic",
  "oil-painting": "cinematic oil painting style, dramatic chiaroscuro lighting, rich textures, classical composition, museum-quality aesthetic",
};

// Map art styles to Leonardo's presetStyle values (used with Alchemy)
// All mapped to CINEMATIC for consistent movie-quality output
const artStyleToPreset: Record<string, string> = {
  cinematic: "CINEMATIC",
  noir: "CINEMATIC",
  realistic: "CINEMATIC",
  fantasy: "CINEMATIC",
  anime: "ANIME",
  "graphic-novel": "CINEMATIC",
  "concept-art": "CINEMATIC",
  "oil-painting": "CINEMATIC",
};

// Leonardo AI model IDs
const LEONARDO_MODELS = {
  NONO_BANANA: "b24e16ff-06e3-43eb-8d33-4416c2d75876",      // Photorealistic
  DIFFUSION_XL: "1e60896f-3c26-4296-8ecc-53e2afecc132",     // General stylized
  ANIME_XL: "e71a1c2f-4f80-4800-934f-2c68979d8cc8",         // Anime/manga
  LUCID_ORIGIN: "7b592283-e8a7-4c5a-9ba6-d18c31f258b9",     // Best for pixel art & versatile styles
};

// Select model based on art style - optimized for cinematic quality
function getModelForStyle(artStyle: string): string {
  const envModel = Deno.env.get("LEONARDO_MODEL_ID");
  if (envModel) return envModel; // Allow env override

  switch (artStyle) {
    case "realistic":
    case "cinematic":
    case "noir":
      return LEONARDO_MODELS.NONO_BANANA; // Best for photorealistic/cinematic
    case "anime":
      return LEONARDO_MODELS.ANIME_XL;
    default:
      // Use Diffusion XL for stylized cinematic content (fantasy, graphic-novel, etc.)
      return LEONARDO_MODELS.DIFFUSION_XL;
  }
}

const MAX_PROMPT_LENGTH = 900;

function buildImagePrompt(options: {
  prompt: string;
  artStyle: string;
  outline?: StoryOutline | null;
  memory?: StoryMemory | null;
  recentPrompts?: string[];
  storyTitle?: string;
  storyDescription?: string;
  styleReference?: string;
  previousPrompt?: string;
}): string {
  const {
    prompt,
    artStyle,
    outline,
    memory,
    recentPrompts = [],
    storyTitle,
    storyDescription,
    styleReference,
    previousPrompt,
  } = options;

  const styleDesc = artStyleDescriptions[artStyle] || artStyleDescriptions["fantasy"];

  const characterContext =
    memory?.characters?.length
      ? memory.characters.map((c) => `${c.name}: ${c.appearance}, wearing ${c.clothing}`).join("; ")
      : outline?.characters?.length
      ? outline.characters.map((c) => `${c.name}: ${c.appearance}, wearing ${c.clothing}`).join("; ")
      : "";

  const settingContext =
    outline?.setting
      ? `${outline.setting.location} (${outline.setting.atmosphere})`
      : memory?.setting?.currentLocation || "";

  const styleGuideFromReference = (() => {
    if (!styleReference) return "";
    try {
      const parsed = typeof styleReference === "string" ? JSON.parse(styleReference) : styleReference;
      if (parsed?.characters) {
        return parsed.characters.map((c: any) => `${c.name}: ${c.description}`).join("; ");
      }
      return typeof parsed === "string" ? parsed : "";
    } catch {
      return "";
    }
  })();

  const styleContinuation =
    recentPrompts.length > 0
      ? `Match style of previous scenes: ${recentPrompts.slice(-2).join(" | ")}`
      : previousPrompt
      ? `Keep consistent with: ${previousPrompt}`
      : "";

  return [
    `IMPORTANT ART STYLE: ${styleDesc}`,
    `This MUST be a cinematic ${artStyle} style scene for adult fiction. Do NOT switch styles.`,
    "Adult fiction illustration: mature themes, romantic tension, emotional chemistry between characters.",
    storyTitle ? `Story: ${storyTitle}` : "",
    storyDescription ? `Summary: ${storyDescription}` : "",
    `Scene: ${prompt}`,
    characterContext ? `Characters (must match, adult characters only): ${characterContext}` : "",
    settingContext ? `Setting: ${settingContext}` : "",
    styleGuideFromReference ? `Style guide: ${styleGuideFromReference}` : "",
    styleContinuation,
    "Cinematic composition, dramatic lighting, movie-quality visuals.",
    "No text or words in the image.",
    `Remember: Cinematic ${artStyle} art style throughout.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function getImageContextFromStory(storyId: string, supabase: any) {
  const { data: story } = await supabase
    .from("stories")
    .select("story_outline, story_memory")
    .eq("id", storyId)
    .single();

  const { data: recentNodes } = await supabase
    .from("story_nodes")
    .select("image_prompt")
    .eq("story_id", storyId)
    .not("image_prompt", "is", null)
    .order("created_at", { ascending: false })
    .limit(3);

  const recentPrompts = (recentNodes || [])
    .map((n: any) => n.image_prompt)
    .filter((p: string | null): p is string => !!p)
    .reverse();

  return {
    outline: story?.story_outline as StoryOutline | null,
    memory: story?.story_memory as StoryMemory | null,
    recentPrompts,
  };
}

async function generateImageWithLeonardo(prompt: string, apiKey: string, artStyle: string): Promise<string> {
  const trimmedPrompt =
    prompt.length > MAX_PROMPT_LENGTH ? `${prompt.slice(0, MAX_PROMPT_LENGTH)}...` : prompt;

  const modelId = getModelForStyle(artStyle);
  const presetStyle = artStyleToPreset[artStyle] || "ILLUSTRATIONS";

  // Lucid Origin doesn't support alchemy/presetStyle - uses different parameters
  const isLucidOrigin = modelId === LEONARDO_MODELS.LUCID_ORIGIN;

  console.log(
    `[Leonardo] Starting image generation (model=${modelId}, preset=${isLucidOrigin ? 'N/A' : presetStyle}, len=${trimmedPrompt.length}) prompt: ${trimmedPrompt.substring(0, 200)}...`
  );

  // Build request body based on model type
  const requestBody: Record<string, unknown> = {
    modelId,
    prompt: trimmedPrompt,
    num_images: 1,
    width: 1024,
    height: 1024,
  };

  if (isLucidOrigin) {
    // Lucid Origin uses different parameters - no alchemy, no presetStyle
    requestBody.contrast = 3.5;
  } else {
    // SDXL models (Diffusion XL, Anime XL, Nono Banana) use Alchemy + presetStyle
    requestBody.alchemy = true;
    requestBody.presetStyle = presetStyle;
    requestBody.promptMagic = false;
    requestBody.enhancePrompt = false;
  }

  // Use V1 API with selected model
  const createResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error("[Leonardo] Create generation error:", errorText);
    throw new Error(`Leonardo image generation failed (${createResponse.status}): ${errorText}`);
  }

  const createData = await createResponse.json();
  const generationId = createData?.sdGenerationJob?.generationId;

  if (!generationId) {
    console.error("[Leonardo] No generation ID in response:", JSON.stringify(createData));
    throw new Error("Leonardo did not return a generation ID");
  }

  console.log(`[Leonardo] Generation started with ID: ${generationId}`);

  // Poll for completion using v1 endpoint (works for all generations)
  const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
  const pollInterval = 2000; // 2 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const statusResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      console.error(`[Leonardo] Status check failed (attempt ${attempt + 1}):`, statusResponse.status);
      continue;
    }

    const statusData = await statusResponse.json();
    const generation = statusData?.generations_by_pk;
    const status = generation?.status;

    console.log(`[Leonardo] Poll attempt ${attempt + 1}: status = ${status}`);

    if (status === "COMPLETE") {
      const images = generation?.generated_images;
      if (images && images.length > 0) {
        const imageUrl = images[0].url;
        console.log(`[Leonardo] Image generated successfully: ${imageUrl}`);
        return imageUrl;
      }
      throw new Error("Leonardo generation complete but no images found");
    }

    if (status === "FAILED") {
      throw new Error("Leonardo image generation failed");
    }
  }

  throw new Error("Leonardo image generation timed out");
}

async function downloadImageAsBuffer(imageUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  return await response.arrayBuffer();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ImageRequest = await req.json();
    const {
      prompt,
      artStyle = "fantasy",
      storyTitle,
      storyDescription,
      styleReference,
      previousPrompt,
      storyId,
      nodeId,
    } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leonardoApiKey = Deno.env.get("LEONARDO_API_KEY");
    if (!leonardoApiKey) {
      return new Response(JSON.stringify({ error: "Leonardo API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let outline: StoryOutline | null = null;
    let memory: StoryMemory | null = null;
    let recentPrompts: string[] = [];

    if (storyId) {
      const context = await getImageContextFromStory(storyId, supabase);
      outline = context.outline;
      memory = context.memory;
      recentPrompts = context.recentPrompts;
    }

    const finalPrompt = buildImagePrompt({
      prompt,
      artStyle,
      outline,
      memory,
      recentPrompts,
      storyTitle,
      storyDescription,
      styleReference,
      previousPrompt,
    });

    // Generate image with Leonardo AI (returns URL directly)
    const leonardoImageUrl = await generateImageWithLeonardo(finalPrompt, leonardoApiKey, artStyle);

    // Download the image from Leonardo and re-upload to our storage
    const imageBuffer = await downloadImageAsBuffer(leonardoImageUrl);

    const fileName = `${crypto.randomUUID()}.png`;
    let uploadError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await supabase.storage
        .from("story-images")
        .upload(fileName, imageBuffer, {
          contentType: "image/png",
          upsert: false,
        });
      uploadError = result.error || null;
      if (!uploadError) break;
      console.warn(`Upload attempt ${attempt + 1} failed, retrying...`, uploadError.message);
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from("story-images").getPublicUrl(fileName);

    if (nodeId) {
      await supabase
        .from("story_nodes")
        .update({
          image_prompt: finalPrompt,
          image_url: publicUrlData.publicUrl,
        })
        .eq("id", nodeId);
    }

    return new Response(
      JSON.stringify({
        imageUrl: publicUrlData.publicUrl,
        promptUsed: finalPrompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating image:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
