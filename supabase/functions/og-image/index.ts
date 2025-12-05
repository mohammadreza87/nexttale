import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const storyId = url.searchParams.get("story");

  if (!storyId) {
    return new Response("Missing story ID", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch story details (allow any story - if user has the link, show preview)
  const { data: story, error } = await supabase
    .from("stories")
    .select("id, title, description, cover_image_url")
    .eq("id", storyId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching story:", error);
    return new Response(JSON.stringify({ error: "Error fetching story", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!story) {
    return new Response("Story not found", { status: 404 });
  }

  const siteUrl = "https://heymina.app";
  const storyUrl = `${siteUrl}?story=${story.id}`;
  const coverImage = story.cover_image_url || `${siteUrl}/android-chrome-512x512.png`;
  const description = story.description?.slice(0, 160) || "An interactive story adventure";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${escapeHtml(story.title)} - Mina</title>
  <meta name="description" content="${escapeHtml(description)}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${storyUrl}">
  <meta property="og:title" content="${escapeHtml(story.title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${coverImage}">
  <meta property="og:site_name" content="Mina - Interactive Stories">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${storyUrl}">
  <meta name="twitter:title" content="${escapeHtml(story.title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${coverImage}">

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container { max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { opacity: 0.9; }
    a { color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(story.title)}</h1>
    <p>${escapeHtml(description)}</p>
    <p>Redirecting to <a href="${storyUrl}">Mina</a>...</p>
  </div>
  <script>window.location.href = "${storyUrl}";</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
