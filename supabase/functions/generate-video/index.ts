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

interface LeonardoMotionResponse {
  motionSvdGenerationJob?: {
    generationId: string;
    apiCreditCost?: number;
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
 * Uses presigned URL with multipart/form-data as per Leonardo docs
 */
async function uploadImageToLeonardo(imageUrl: string, apiKey: string): Promise<string> {
  console.log(`[Leonardo] Uploading image from URL: ${imageUrl.substring(0, 100)}...`);

  // Determine extension from URL
  const extension = imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg')
    ? 'jpg'
    : 'png';

  // First, get a presigned URL for upload
  const initResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/init-image", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      extension: extension,
    }),
  });

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    console.error("[Leonardo] Init image error:", errorText);
    throw new Error(`Failed to initialize image upload: ${initResponse.status}`);
  }

  const initData = await initResponse.json();
  const { uploadInitImage } = initData;

  console.log(`[Leonardo] Init response:`, JSON.stringify(uploadInitImage, null, 2));

  if (!uploadInitImage?.url || !uploadInitImage?.id || !uploadInitImage?.fields) {
    throw new Error("Leonardo did not return required upload fields (url, id, fields)");
  }

  console.log(`[Leonardo] Got presigned URL, image ID: ${uploadInitImage.id}`);

  // Download the image from the source URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download source image: ${imageResponse.status}`);
  }
  const imageBlob = await imageResponse.blob();

  // Build multipart form data with all required fields
  const formData = new FormData();

  // Add all fields from the presigned URL response (order matters for S3)
  const fields = JSON.parse(uploadInitImage.fields);
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value as string);
  }

  // Add the file last (required by S3)
  formData.append('file', imageBlob, `image.${extension}`);

  // Upload to S3 using POST with multipart/form-data
  const uploadResponse = await fetch(uploadInitImage.url, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("[Leonardo] Upload error:", errorText);
    throw new Error(`Failed to upload image: ${uploadResponse.status} - ${errorText}`);
  }

  console.log(`[Leonardo] Image uploaded successfully, ID: ${uploadInitImage.id}`);
  return uploadInitImage.id;
}

/**
 * Generate a video from an image using Leonardo AI Motion SVD
 * Uses the generations-motion-svd endpoint for uploaded images
 */
async function generateVideoWithLeonardo(
  imageId: string,
  _prompt: string,
  apiKey: string,
  motionStrength: number = 5
): Promise<string> {
  console.log(`[Leonardo] Starting Motion SVD video generation for image: ${imageId}`);

  // Motion SVD endpoint parameters
  const requestBody = {
    imageId,
    isInitImage: true,  // Required for uploaded images
    motionStrength: motionStrength,  // 1-10, controls animation intensity
    isPublic: false,
  };

  console.log(`[Leonardo] Request body:`, JSON.stringify(requestBody));

  const createResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations-motion-svd", {
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

  const createData = await createResponse.json();
  console.log(`[Leonardo] Full Response:`, JSON.stringify(createData, null, 2));

  // Try multiple possible response paths
  const generationId = createData?.motionSvdGenerationJob?.generationId
    || createData?.sdGenerationJob?.generationId
    || createData?.generationJob?.generationId
    || createData?.generationId;

  if (!generationId) {
    console.error("[Leonardo] No generation ID found in any response field:", JSON.stringify(createData));
    throw new Error(`Leonardo Motion API returned unexpected response: ${JSON.stringify(createData)}`);
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

    // Step 2: Generate video from the image using Motion SVD
    // Motion strength: 1-10, where lower is more subtle
    const motionStrength = 5; // Medium motion for cinematic effect
    const leonardoVideoUrl = await generateVideoWithLeonardo(
      leonardoImageId,
      prompt || "",
      leonardoApiKey,
      motionStrength
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
