import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StoryRequest {
  storyContext?: string;
  userChoice?: string;
  previousContent?: string;
  storyTitle?: string;
  userPrompt?: string;
  generateFullStory?: boolean;
  chapterCount?: number;
}

const DEFAULT_GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash-lite";

async function callGemini(
  prompt: string,
  apiKey: string,
  {
    temperature = 0.7,
    maxOutputTokens = 1200,
    model = DEFAULT_GEMINI_MODEL,
    responseMimeType = "application/json",
  }: { temperature?: number; maxOutputTokens?: number; model?: string; responseMimeType?: string } = {}
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens, responseMimeType },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini stream API error:", errorText);
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("").trim() || "";

  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

function parseJsonLoose(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // ignore
      }
    }
    throw new Error("Failed to parse JSON from model output");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { storyContext, userChoice, previousContent, storyTitle, userPrompt, generateFullStory, chapterCount }: StoryRequest =
      await req.json();

    if (generateFullStory) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("subscription_tier, is_grandfathered, stories_generated_today, last_generation_date")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        const hasPro = profile.subscription_tier === "pro" || profile.is_grandfathered;
        if (!hasPro) {
          const today = new Date().toISOString().split("T")[0];
          const todayCount = profile.last_generation_date === today ? profile.stories_generated_today : 0;
          if (todayCount >= 2) {
            return new Response(
              JSON.stringify({
                error: "daily_limit_reached",
                message: "You've reached your daily limit of 2 stories. Upgrade to Pro for unlimited stories!",
                limit: 2,
                used: todayCount,
              }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompts
    let systemPrompt = "";
    let actualUserPrompt = "";

    if (generateFullStory && userPrompt) {
      systemPrompt = `You are a creative children's story writer. Return ONLY JSON in this shape:
{
  "title": "Story Title",
  "description": "Brief 1-2 sentence description",
  "ageRange": "5-10",
  "estimatedDuration": 10,
  "storyContext": "Brief context for AI to continue generating",
  "startContent": "Opening paragraphs (2-3 SHORT paragraphs)",
  "initialChoices": [
    {"text": "Choice 1 text", "hint": "What might happen"},
    {"text": "Choice 2 text", "hint": "What might happen"}
  ],
  "language": "en"
}
Write in the same language as the user's prompt. Keep content age-appropriate.`;

      actualUserPrompt = `User prompt: "${userPrompt}"\nCreate a full story setup with opening content and 2-3 choices.`;
    } else {
      const currentChapter = chapterCount || 0;
      const minimumChapters = 3;
      const maximumChapters = 6;
      const shouldPreventEnding = currentChapter < minimumChapters;
      const shouldEncourageEnding = currentChapter >= maximumChapters;

      systemPrompt = `Children's story writer for ages 5-10. Return ONLY JSON:
{
  "content": "Story text (2 SHORT paragraphs)",
  "choices": [{"text": "Choice 1", "hint": "Hint 1"}, {"text": "Choice 2", "hint": "Hint 2"}],
  "isEnding": false,
  "endingType": null
}
Rules:
- Simple, safe language for kids
- ${shouldPreventEnding ? "Do not end yet; include 2-3 choices." : shouldEncourageEnding ? "Try to conclude the story soon." : "Continue building the story."}
- If ending, set isEnding=true, set endingType to happy/learning_moment/neutral, choices=[]`;

      actualUserPrompt = userChoice && previousContent
        ? `Title: ${storyTitle || "Adventure"}\nPrevious: ${previousContent}\nReader chose: "${userChoice}". Continue the story in the same language.`
        : `Theme: ${storyContext}\nWrite the next chapter with choices in the same language.`;
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        try {
          const raw = await callGemini(`${systemPrompt}\n\n${actualUserPrompt}`, geminiApiKey, {
            temperature: 0.65,
            maxOutputTokens: generateFullStory ? 2000 : 800,
            responseMimeType: "application/json",
          });

          send({ type: "progress", content: raw.slice(0, 280) });

          const parsed = parseJsonLoose(raw);

          if (generateFullStory) {
            const today = new Date().toISOString().split("T")[0];
            const { data: currentProfile } = await supabase
              .from("user_profiles")
              .select("last_generation_date, stories_generated_today, total_stories_generated")
              .eq("id", user.id)
              .maybeSingle();

            const isNewDay = currentProfile?.last_generation_date !== today;
            await supabase
              .from("user_profiles")
              .update({
                stories_generated_today: isNewDay ? 1 : (currentProfile?.stories_generated_today || 0) + 1,
                last_generation_date: today,
                total_stories_generated: (currentProfile?.total_stories_generated || 0) + 1,
              })
              .eq("id", user.id);
          }

          send({ type: "complete", data: parsed });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          send({ type: "error", error: message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
