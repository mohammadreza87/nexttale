import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import {
  type StoryOutline,
  type StoryMemory,
  type ImageContext,
  buildStoryContextPrompt as _buildStoryContextPrompt,
  updateMemory,
  initializeMemoryFromOutline as _initializeMemoryFromOutline,
} from '../_shared/storyTypes.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DEFAULT_GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash-lite';

interface NodeToGenerate {
  nodeKey: string;
  parentNodeId?: string;
  choiceText?: string;
  choiceHint?: string;
  choiceOrder?: number;
  depth: number;
  previousContent: string;
  chapterNumber: number;
  parentChapterSummary?: string;
}

interface GenerationContext {
  outline: StoryOutline | null;
  memory: StoryMemory;
  imageContext: ImageContext | null;
}

async function callGemini(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  options: { temperature?: number; maxOutputTokens?: number; json?: boolean } = {}
): Promise<string> {
  const { temperature = 0.55, maxOutputTokens = 700, json = false } = options;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text || '')
      .join('')
      .trim() || ''
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  let requestBody: any = {};
  let job: any = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    requestBody = await req.json().catch(() => ({}));
    const requestedStoryId = requestBody?.storyId as string | undefined;

    // Pick a pending job from the queue (or lock the requested story's job)
    if (requestedStoryId) {
      const { data: existingJob } = await supabase
        .from('generation_queue')
        .select('*')
        .eq('story_id', requestedStoryId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingJob && existingJob.status === 'processing') {
        return new Response(JSON.stringify({ error: 'Story generation already in progress' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (existingJob) {
        const { data: lockedJob } = await supabase
          .from('generation_queue')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', existingJob.id)
          .eq('status', 'pending')
          .select()
          .maybeSingle();

        job = lockedJob || existingJob;
      } else {
        return new Response(JSON.stringify({ error: 'No queued job found for this story' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const { data: pendingJobs } = await supabase
        .from('generation_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1);

      const nextJob = pendingJobs && pendingJobs.length > 0 ? pendingJobs[0] : null;

      if (!nextJob) {
        return new Response(JSON.stringify({ message: 'No pending stories to process' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: lockedJob } = await supabase
        .from('generation_queue')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', nextJob.id)
        .eq('status', 'pending')
        .select()
        .maybeSingle();

      job = lockedJob || nextJob;
    }

    if (!job) {
      return new Response(JSON.stringify({ error: 'Failed to lock a generation job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storyId = job.story_id;

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      throw new Error('Story not found');
    }

    const { data: startNode } = await supabase
      .from('story_nodes')
      .select('*')
      .eq('story_id', storyId)
      .eq('node_key', 'start')
      .maybeSingle();

    if (!startNode) {
      throw new Error('Start node not found. Story was not properly initialized.');
    }

    const { data: existingChoices } = await supabase
      .from('story_choices')
      .select(
        `
        *,
        to_node:story_nodes!story_choices_to_node_id_fkey(*)
      `
      )
      .eq('from_node_id', startNode.id)
      .order('choice_order');

    if (!existingChoices || existingChoices.length === 0) {
      throw new Error('No choices found for start node. Story was not properly initialized.');
    }

    const firstChapterSummary =
      startNode.chapter_summary || `Chapter 1: ${startNode.content.slice(0, 100)}...`;

    const choicesData = existingChoices
      .map((choice, i) => ({
        nodeKey: `node_1_${i + 1}`,
        parentNodeId: choice.to_node_id,
        choiceText: choice.choice_text,
        choiceHint: choice.consequence_hint,
        choiceOrder: i,
        depth: 1,
        previousContent: startNode.content,
        chapterNumber: 2,
        parentChapterSummary: firstChapterSummary,
      }))
      .slice(0, 2);

    const totalNodesEstimate = 1 + 3 + 9 + 27;

    await supabase
      .from('stories')
      .update({
        generation_status: 'generating_background',
        generation_started_at: new Date().toISOString(),
        generation_progress: 15,
        nodes_generated: 1,
        total_nodes_planned: totalNodesEstimate,
      })
      .eq('id', storyId);

    const context: GenerationContext = {
      outline: story.story_outline as StoryOutline | null,
      memory: (story.story_memory as StoryMemory) || createInitialMemory(story, startNode),
      imageContext: null,
    };

    generateStoryTree(
      storyId,
      story,
      choicesData,
      supabase,
      geminiApiKey,
      supabaseUrl,
      supabaseServiceKey,
      job.id,
      context
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'First chapter generated, background generation started',
        progress: 10,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing story queue:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const requestedStoryId = requestBody?.storyId as string | undefined;
      if (job?.id) {
        await supabase
          .from('generation_queue')
          .update({ status: 'failed', error_message: errorMessage })
          .eq('id', job.id);
      } else if (requestedStoryId) {
        const { data: existingJob } = await supabase
          .from('generation_queue')
          .select('id')
          .eq('story_id', requestedStoryId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existingJob) {
          await supabase
            .from('generation_queue')
            .update({ status: 'failed', error_message: errorMessage })
            .eq('id', existingJob.id);
        }
      }
    } catch (queueError) {
      console.error('Failed to update queue status after error:', queueError);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createInitialMemory(story: any, startNode: any): StoryMemory {
  return {
    currentChapter: 1,
    characters: [],
    keyEvents: [
      {
        chapter: 1,
        event: startNode.chapter_summary || `Story begins: ${startNode.content.slice(0, 80)}`,
        importance: 'major',
      },
    ],
    currentConflict: story.story_context || '',
    unresolvedThreads: [
      {
        id: 'main_plot',
        description: story.story_context || 'The main adventure',
        introducedInChapter: 1,
      },
    ],
    resolvedThreads: [],
    setting: {
      currentLocation: 'Unknown',
      previousLocations: [],
    },
    emotionalArc: 'beginning',
    foreshadowing: [],
  };
}

async function generateStoryTree(
  storyId: string,
  story: any,
  nodesToGenerate: NodeToGenerate[],
  supabase: any,
  geminiApiKey: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  queueId?: string,
  context?: GenerationContext
) {
  try {
    await supabase
      .from('stories')
      .update({ generation_status: 'generating_full_story' })
      .eq('id', storyId);

    const maxDepth = 3;
    const queue = [...nodesToGenerate];
    let generatedCount = 1;
    const totalNodes = await estimateTotalNodes(storyId, supabase);

    const outline = context?.outline;
    let memory =
      context?.memory || createInitialMemory(story, { content: '', chapter_summary: '' });

    if (!outline) {
      const beats = await createStoryBeats(story, geminiApiKey);
      console.log('Created story beats for legacy story:', beats?.slice(0, 100));
    }

    const chapterSummaries: string[] = [];
    if (memory.keyEvents.length > 0) {
      memory.keyEvents.forEach((e) => chapterSummaries.push(`Ch${e.chapter}: ${e.event}`));
    }

    while (queue.length > 0) {
      const node = queue.shift()!;

      if (node.depth > maxDepth) {
        continue;
      }

      try {
        const trimmedContext = (story.story_context || '').slice(0, 800);
        const trimmedPrevious = (node.previousContent || '').slice(-1000);

        const shouldEnd = node.depth >= maxDepth;
        const isNearEnd = node.depth >= maxDepth - 1;

        const systemPrompt = buildCoherentSystemPrompt(
          memory,
          outline,
          node.chapterNumber,
          shouldEnd,
          isNearEnd,
          chapterSummaries
        );

        const userPrompt = `Story context: ${trimmedContext}

Previous chapter:
${trimmedPrevious}

The reader chose: "${node.choiceText}"

${node.parentChapterSummary ? `Previous chapter summary: ${node.parentChapterSummary}` : ''}

Write chapter ${node.chapterNumber} that directly follows from this choice.`;

        const content = await callGemini(userPrompt, systemPrompt, geminiApiKey, { json: true });

        let generatedContent;
        try {
          generatedContent = JSON.parse(content);
        } catch {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generatedContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse generated content');
          }
        }

        if (shouldEnd && !generatedContent.isEnding) {
          generatedContent.isEnding = true;
          generatedContent.endingType = generatedContent.endingType || 'happy';
          generatedContent.choices = [];
        }

        if (generatedContent.choices && generatedContent.choices.length > 2) {
          generatedContent.choices = generatedContent.choices.slice(0, 2);
        }

        const isKidFriendly = await validateKidFriendlyContent(
          generatedContent.content,
          geminiApiKey
        );
        if (!isKidFriendly) {
          console.warn(`Content not kid-friendly for node ${node.nodeKey}, regenerating...`);
          queue.unshift(node);
          continue;
        }

        const chapterSummary =
          generatedContent.chapterSummary ||
          (await extractChapterSummary(generatedContent.content, geminiApiKey));

        if (generatedContent.memoryUpdates) {
          memory = updateMemory(memory, generatedContent.memoryUpdates, node.chapterNumber);
        }
        memory.currentChapter = node.chapterNumber;
        memory.keyEvents.push({
          chapter: node.chapterNumber,
          event: chapterSummary,
          importance: 'major',
        });
        chapterSummaries.push(`Ch${node.chapterNumber}: ${chapterSummary}`);

        const { data: updatedNode, error: updateError } = await supabase
          .from('story_nodes')
          .update({
            node_key: node.nodeKey,
            content: generatedContent.content,
            is_ending: generatedContent.isEnding || false,
            ending_type: generatedContent.endingType,
            is_placeholder: false,
            generation_attempts: 1,
            chapter_summary: chapterSummary,
            character_states:
              memory.characters.length > 0
                ? Object.fromEntries(memory.characters.map((c) => [c.name, c.appearance]))
                : null,
          })
          .eq('id', node.parentNodeId)
          .select()
          .single();

        if (updateError || !updatedNode) {
          console.error('Failed to update node:', updateError);
          continue;
        }

        generatedCount++;
        const progress = Math.min(95, Math.floor((generatedCount / totalNodes) * 100));

        await supabase
          .from('stories')
          .update({
            nodes_generated: generatedCount,
            generation_progress: progress,
            story_memory: memory,
          })
          .eq('id', storyId);

        if (!updatedNode.audio_url && story.narrator_enabled) {
          await generateAudio(
            updatedNode.id,
            generatedContent.content,
            supabaseUrl,
            supabaseServiceKey
          );
        }

        if (
          !generatedContent.isEnding &&
          generatedContent.choices &&
          generatedContent.choices.length > 0 &&
          node.depth < maxDepth
        ) {
          for (let i = 0; i < generatedContent.choices.length; i++) {
            const choice = generatedContent.choices[i];

            const { data: placeholderNode } = await supabase
              .from('story_nodes')
              .insert({
                story_id: storyId,
                node_key: `node_${node.depth + 1}_${generatedCount}_${i}_placeholder`,
                content: '',
                is_placeholder: true,
                order_index: node.depth + 1,
              })
              .select()
              .single();

            if (placeholderNode) {
              await supabase.from('story_choices').insert({
                from_node_id: updatedNode.id,
                to_node_id: placeholderNode.id,
                choice_text: choice.text,
                consequence_hint: choice.hint,
                choice_order: i,
              });

              queue.push({
                nodeKey: `node_${node.depth + 1}_${generatedCount}_${i}`,
                parentNodeId: placeholderNode.id,
                choiceText: choice.text,
                choiceHint: choice.hint,
                choiceOrder: i,
                depth: node.depth + 1,
                previousContent: generatedContent.content,
                chapterNumber: node.chapterNumber + 1,
                parentChapterSummary: chapterSummary,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error generating node ${node.nodeKey}:`, error);

        const { data: attemptNode } = await supabase
          .from('story_nodes')
          .select('generation_attempts')
          .eq('id', node.parentNodeId)
          .maybeSingle();
        const attempts = (attemptNode?.generation_attempts || 0) + 1;

        await supabase
          .from('story_nodes')
          .update({
            generation_failed: true,
            generation_attempts: attempts,
          })
          .eq('id', node.parentNodeId);

        if (attempts >= 3) {
          await supabase
            .from('stories')
            .update({
              generation_status: 'generation_failed',
              generation_progress: 0,
            })
            .eq('id', storyId);
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, attempts * 1500));
      }
    }

    await supabase
      .from('stories')
      .update({
        generation_status: 'fully_generated',
        generation_progress: 100,
        generation_completed_at: new Date().toISOString(),
        story_memory: memory,
      })
      .eq('id', storyId);

    if (queueId) {
      await supabase
        .from('generation_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', queueId);
    }

    console.log(`Story ${storyId} fully generated with memory tracking`);

    try {
      console.log(`Generating all images for story ${storyId}`);
      await generateAllImages(storyId, supabaseUrl, supabaseServiceKey);

      // Generate videos after images (uses images as reference)
      console.log(`Generating videos for story ${storyId}`);
      await generateAllVideos(storyId, supabaseUrl, supabaseServiceKey);
    } catch (error) {
      console.error(`Error generating images/videos for story ${storyId}:`, error);
    }
  } catch (error) {
    console.error('Error in generateStoryTree:', error);

    await supabase
      .from('stories')
      .update({
        generation_status: 'generation_failed',
      })
      .eq('id', storyId);

    if (queueId) {
      await supabase
        .from('generation_queue')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', queueId);
    }
  }
}

function buildCoherentSystemPrompt(
  memory: StoryMemory,
  outline: StoryOutline | null,
  chapterNumber: number,
  shouldEnd: boolean,
  isNearEnd: boolean,
  chapterSummaries: string[]
): string {
  const characterContext =
    memory.characters.length > 0
      ? memory.characters.map((c) => `${c.name}: ${c.appearance}, wearing ${c.clothing}`).join('\n')
      : 'Characters will be established in the story.';

  const eventsSummary =
    chapterSummaries.length > 0 ? chapterSummaries.slice(-5).join('\n') : 'Story just beginning.';

  const unresolvedList =
    memory.unresolvedThreads.length > 0
      ? memory.unresolvedThreads.map((t) => `- ${t.description}`).join('\n')
      : 'Main story arc in progress.';

  const chapterOutline = outline?.chapters[chapterNumber - 1];

  return `You are a children's story writer for ages 5-10.

STORY MEMORY (YOU MUST NOT CONTRADICT THIS):
===========================================
Characters (describe them EXACTLY as stated):
${characterContext}

What happened so far:
${eventsSummary}

Unresolved plot threads (must be addressed):
${unresolvedList}

Current conflict: ${memory.currentConflict}
Current location: ${memory.setting.currentLocation}

${
  chapterOutline
    ? `
CHAPTER ${chapterNumber} REQUIREMENTS:
- Title: ${chapterOutline.title}
- Key event that MUST happen: ${chapterOutline.keyEvent}
- Emotional beat: ${chapterOutline.emotionalBeat}
- Must reference: ${chapterOutline.mustReference.join(', ')}
`
    : ''
}

${
  shouldEnd
    ? `THIS IS THE FINAL CHAPTER. You MUST:
- Resolve the main conflict
- Wrap up unresolved threads
- Give a satisfying, happy ending
- Set isEnding=true, endingType="happy", choices=[]
`
    : isNearEnd
      ? `This is near the end. Start wrapping up conflicts and moving toward resolution.`
      : `Continue building the story.`
}

CRITICAL RULES:
1. Characters must match their established appearances EXACTLY
2. Reference at least ONE previous event from the story
3. Stay consistent with current location unless there's a reason to move
4. Write 2-3 SHORT paragraphs (4-6 sentences total)
5. NO violence, fear, bullying, weapons, or sadness
6. Simple words for children aged 5-10
${!shouldEnd ? '7. Provide exactly 2 meaningful choices' : ''}

Return ONLY valid JSON:
{
  "content": "The chapter text",
  "choices": ${shouldEnd ? '[]' : '[{"text": "Choice 1", "hint": "What might happen"}, {"text": "Choice 2", "hint": "What might happen"}]'},
  "isEnding": ${shouldEnd},
  "endingType": ${shouldEnd ? '"happy"' : 'null'},
  "chapterSummary": "One sentence summary of the key event in this chapter",
  "memoryUpdates": {
    "keyEvents": [{"event": "What happened", "importance": "major"}],
    "resolvedThreads": [],
    "newLocation": null,
    "newConflict": null
  }
}`;
}

async function extractChapterSummary(content: string, geminiApiKey: string): Promise<string> {
  try {
    const result = await callGemini(
      content,
      'Summarize the key event in this chapter in ONE sentence. Focus on what happened, not descriptions.',
      geminiApiKey,
      { temperature: 0.3, maxOutputTokens: 50 }
    );
    return result.trim() || content.slice(0, 80) + '...';
  } catch {
    return content.slice(0, 80) + '...';
  }
}

async function validateKidFriendlyContent(content: string, geminiApiKey: string): Promise<boolean> {
  try {
    const result = await callGemini(
      `Is this content appropriate for children aged 5-10? Check for violence, scary content, inappropriate themes, or anything that might frighten or upset young children.\n\nContent: ${content}`,
      "You are a content moderator for children's stories. Analyze if the content is appropriate for kids aged 5-10. Return only 'YES' if appropriate or 'NO' if inappropriate.",
      geminiApiKey,
      { temperature: 0.3, maxOutputTokens: 10 }
    );
    return result.toUpperCase().includes('YES');
  } catch (error) {
    console.error('Error validating content:', error);
    return true;
  }
}

async function estimateTotalNodes(storyId: string, supabase: any): Promise<number> {
  const { count } = await supabase
    .from('story_nodes')
    .select('*', { count: 'exact', head: true })
    .eq('story_id', storyId);

  return Math.max(count || 40, 40);
}

async function generateAudio(
  nodeId: string,
  content: string,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        text: content,
        nodeId,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to generate audio for node ${nodeId}`);
    }
  } catch (error) {
    console.error(`Error generating audio for node ${nodeId}:`, error);
  }
}

async function generateVideo(
  nodeId: string,
  content: string,
  imageUrl: string | null,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  try {
    // Extract a visual scene description from the content
    const prompt = content.slice(0, 300); // Use first 300 chars as scene description

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        prompt,
        imageUrl: imageUrl || undefined, // Use chapter image as reference if available
        nodeId,
        duration: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to generate video for node ${nodeId}:`, errorText);
    } else {
      console.log(`Video generated successfully for node ${nodeId}`);
    }
  } catch (error) {
    console.error(`Error generating video for node ${nodeId}:`, error);
  }
}

async function generateAllImages(storyId: string, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-all-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        storyId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`Failed to generate images:`, errorData);
      throw new Error(errorData.error || 'Failed to generate images');
    }

    await response.json();
    console.log(`All images generated successfully for story ${storyId}`);
  } catch (error) {
    console.error(`Error generating images:`, error);
    throw error;
  }
}

async function generateAllVideos(storyId: string, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get story to check if video is enabled
    const { data: story } = await supabase
      .from('stories')
      .select('video_enabled')
      .eq('id', storyId)
      .single();

    if (!story?.video_enabled) {
      console.log(`Video generation not enabled for story ${storyId}`);
      return;
    }

    // Get all nodes with images (we use images as reference for video)
    const { data: nodes } = await supabase
      .from('story_nodes')
      .select('id, content, image_url')
      .eq('story_id', storyId)
      .eq('is_placeholder', false)
      .not('content', 'is', null)
      .order('order_index');

    if (!nodes || nodes.length === 0) {
      console.log(`No nodes found for video generation in story ${storyId}`);
      return;
    }

    console.log(`Generating videos for ${nodes.length} nodes in story ${storyId}`);

    // Generate videos sequentially to avoid rate limits
    for (const node of nodes) {
      if (!node.content) continue;

      try {
        await generateVideo(node.id, node.content, node.image_url, supabaseUrl, supabaseServiceKey);

        // Small delay between video generations to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to generate video for node ${node.id}:`, error);
        // Continue with other nodes even if one fails
      }
    }

    console.log(`Video generation completed for story ${storyId}`);
  } catch (error) {
    console.error(`Error in generateAllVideos:`, error);
    // Don't throw - video generation failure shouldn't fail the whole story
  }
}

async function createStoryBeats(story: any, geminiApiKey: string): Promise<string | null> {
  try {
    const result = await callGemini(
      `Create a concise outline (3-4 beats) for this story. Each beat should include the main action and the emotional focus. Keep language simple.\n\nTitle: ${story.title}\nContext: ${(story.story_context || '').slice(0, 600)}`,
      "Outline generator for children's branching stories. Return 3-4 short beats that cover beginning, middle, and end without full prose.",
      geminiApiKey,
      { temperature: 0.4, maxOutputTokens: 220 }
    );
    return result || null;
  } catch (error) {
    console.error('Failed to create story beats:', error);
    return null;
  }
}
