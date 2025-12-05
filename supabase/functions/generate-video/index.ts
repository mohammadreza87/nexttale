import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VideoRequest {
  imageUrl: string;
  prompt?: string;
  storyId?: string;
  nodeId?: string;
  resolution?: "480" | "720";
}

interface LeonardoGenerationResponse {
  sdGenerationJob?: {
    generationId: string;
  };
}

interface LeonardoStatusResponse {
  generations_by_pk?: {
    status: string;
    generated_images?: Array<{
      id: string;
      url: string;
      motionMP4URL?: string;
    }>;
  };
}

/**
 * Upload an image URL to Leonardo AI and get an image ID
 */
async function uploadImageToLeonardo(imageUrl: string, apiKey: string): Promise<string> {
  console.log(`[Leonardo] Uploading image from URL: ${imageUrl.substring(0, 100)}...`);

  // First, get a presigned URL for upload
  const initResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/init-image", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      extension: "png",
    }),
  });

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error("[Leonardo] Init image error:", errorText);
    throw new Error(`Failed to initialize image upload: ${initResponse.status}`);
  }

  const initData = await initResponse.json();
  const { uploadInitImage } = initData;

  if (!uploadInitImage?.url || !uploadInitImage?.id) {
    throw new Error("Leonardo did not return upload URL or image ID");
  }

  console.log(`[Leonardo] Got presigned URL, image ID: ${uploadInitImage.id}`);

  // Download the image from the source URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download source image: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();

  // Upload the image to Leonardo's presigned URL
  const uploadResponse = await fetch(uploadInitImage.url, {
    method: "PUT",
    headers: {
      "Content-Type": "image/png",
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("[Leonardo] Upload error:", errorText);
    throw new Error(`Failed to upload image: ${uploadResponse.status}`);
  }

  console.log(`[Leonardo] Image uploaded successfully, ID: ${uploadInitImage.id}`);
  return uploadInitImage.id;
}

/**
 * Generate a video from an image using Leonardo AI Motion
 */
async function generateVideoWithLeonardo(
  imageId: string,
  prompt: string,
  apiKey: string,
  resolution: "480" | "720" = "480"
): Promise<string> {
  console.log(`[Leonardo] Starting video generation for image: ${imageId}`);

  const requestBody = {
    imageId,
    imageType: "UPLOADED",
    isPublic: false,
    resolution: resolution === "720" ? "RESOLUTION_720" : "RESOLUTION_480",
    prompt: prompt || "Subtle cinematic movement, gentle camera motion, atmospheric lighting shifts",
    frameInterpolation: true,
    promptEnhance: false,
  };

  const createResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations-image-to-video", {
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
    console.error("[Leonardo] Create video error:", errorText);
    throw new Error(`Leonardo video generation failed (${createResponse.status}): ${errorText}`);
  }

  const createData: LeonardoGenerationResponse = await createResponse.json();
  const generationId = createData?.sdGenerationJob?.generationId;

  if (!generationId) {
    console.error("[Leonardo] No generation ID in response:", JSON.stringify(createData));
    throw new Error("Leonardo did not return a generation ID");
  }

  console.log(`[Leonardo] Video generation started with ID: ${generationId}`);

  // Poll for completion - video takes longer than images
  const maxAttempts = 120; // 120 attempts * 3 seconds = 6 minutes max
  const pollInterval = 3000; // 3 seconds

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

    const statusData: LeonardoStatusResponse = await statusResponse.json();
    const generation = statusData?.generations_by_pk;
    const status = generation?.status;

    console.log(`[Leonardo] Poll attempt ${attempt + 1}: status = ${status}`);

    if (status === "COMPLETE") {
      const images = generation?.generated_images;
      if (images && images.length > 0) {
        // For video generation, the video URL is in motionMP4URL
        const videoUrl = images[0].motionMP4URL || images[0].url;
        if (videoUrl) {
          console.log(`[Leonardo] Video generated successfully: ${videoUrl}`);
          return videoUrl;
        }
      }
      throw new Error("Leonardo generation complete but no video found");
    }

    if (status === "FAILED") {
      throw new Error("Leonardo video generation failed");
    }
  }

  throw new Error("Leonardo video generation timed out");
}

/**
 * Download video and upload to Supabase storage
 */
async function downloadAndUploadVideo(
  videoUrl: string,
  supabase: ReturnType<typeof createClient>,
  nodeId?: string
): Promise<string> {
  console.log(`[Video] Downloading from: ${videoUrl.substring(0, 100)}...`);

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status}`);
  }

  const videoBuffer = await response.arrayBuffer();
  const fileName = `${nodeId || crypto.randomUUID()}-video.mp4`;

  let uploadError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await supabase.storage
      .from("story-images")
      .upload(fileName, videoBuffer, {
        contentType: "video/mp4",
        upsert: false,
      });
    uploadError = result.error || null;
    if (!uploadError) break;
    console.warn(`Upload attempt ${attempt + 1} failed, retrying...`, uploadError.message);
    await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
  }

  if (uploadError) {
    throw new Error(`Failed to upload video: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from("story-images").getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: VideoRequest = await req.json();
    const { imageUrl, prompt, storyId, nodeId, resolution = "480" } = body;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Image URL is required" }), {
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

    // Step 1: Upload the image to Leonardo
    const leonardoImageId = await uploadImageToLeonardo(imageUrl, leonardoApiKey);

    // Step 2: Generate video from the image
    const videoPrompt = prompt || "Subtle cinematic movement with gentle parallax, atmospheric lighting shifts, soft ambient motion";
    const leonardoVideoUrl = await generateVideoWithLeonardo(
      leonardoImageId,
      videoPrompt,
      leonardoApiKey,
      resolution
    );

    // Step 3: Download and re-upload to our storage
    const publicVideoUrl = await downloadAndUploadVideo(leonardoVideoUrl, supabase, nodeId);

    // Step 4: Update the story node if nodeId provided
    if (nodeId) {
      await supabase
        .from("story_nodes")
        .update({ video_url: publicVideoUrl })
        .eq("id", nodeId);
    }

    return new Response(
      JSON.stringify({
        videoUrl: publicVideoUrl,
        leonardoImageId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating video:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
