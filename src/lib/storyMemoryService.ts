/**
 * Story Memory Service
 *
 * Manages story coherence by tracking:
 * - Story outlines (pre-generated structure)
 * - Story memory (accumulated context)
 * - Character consistency
 * - Image context for visual coherence
 */

import { supabase } from './supabase';
import type {
  StoryOutline,
  StoryMemory,
  StoryCharacter as _StoryCharacter,
  ChapterOutline as _ChapterOutline,
  ImageContext,
} from './types';

// ============================================
// Story Outline Management
// ============================================

/**
 * Fetch the story outline from the database
 * Note: story_outline column may not exist yet - returns null if not available
 */
export async function getStoryOutline(storyId: string): Promise<StoryOutline | null> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Cast to access potential story_outline field
  const storyData = data as unknown as { story_outline?: StoryOutline };
  return storyData.story_outline || null;
}

/**
 * Save or update the story outline
 * Note: story_outline column may not exist yet - operation may fail silently
 */
export async function saveStoryOutline(storyId: string, outline: StoryOutline): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ story_outline: outline } as Record<string, unknown>)
    .eq('id', storyId);

  if (error) {
    console.error('Error saving story outline:', error);
    // Don't throw - column may not exist yet
  }
}

// ============================================
// Story Memory Management
// ============================================

/**
 * Get the current story memory
 * Note: story_memory column may not exist yet - returns null if not available
 */
export async function getStoryMemory(storyId: string): Promise<StoryMemory | null> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Cast to access potential story_memory field
  const storyData = data as unknown as { story_memory?: StoryMemory };
  return storyData.story_memory || null;
}

/**
 * Save or update the story memory
 * Note: story_memory column may not exist yet - operation may fail silently
 */
export async function saveStoryMemory(storyId: string, memory: StoryMemory): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ story_memory: memory } as Record<string, unknown>)
    .eq('id', storyId);

  if (error) {
    console.error('Error saving story memory:', error);
    // Don't throw - column may not exist yet
  }
}

/**
 * Initialize story memory from outline
 */
export function initializeMemoryFromOutline(outline: StoryOutline): StoryMemory {
  return {
    currentChapter: 0,
    characters: outline.characters,
    keyEvents: [],
    currentConflict: outline.chapters[0]?.conflict || '',
    unresolvedThreads: outline.plotThreads.map((pt) => ({
      id: pt.id,
      description: pt.description,
      introducedInChapter: pt.introducedInChapter,
    })),
    resolvedThreads: [],
    setting: {
      currentLocation: outline.setting.location,
      previousLocations: [],
    },
    emotionalArc: 'beginning',
    foreshadowing: [],
  };
}

// ============================================
// Chapter Summary & Memory Extraction
// ============================================

/**
 * Save chapter summary to a story node
 */
export async function saveChapterSummary(
  nodeId: string,
  summary: string,
  characterStates?: Record<string, string>
): Promise<void> {
  const updateData: Record<string, unknown> = { chapter_summary: summary };
  if (characterStates) {
    updateData.character_states = characterStates;
  }

  const { error } = await supabase.from('story_nodes').update(updateData).eq('id', nodeId);

  if (error) {
    console.error('Error saving chapter summary:', error);
    throw error;
  }
}

/**
 * Get all chapter summaries for a story (for context building)
 * Note: chapter_summary column may not exist yet
 */
export async function getChapterSummaries(
  storyId: string
): Promise<Array<{ nodeId: string; nodeKey: string; summary: string }>> {
  const { data, error } = await supabase
    .from('story_nodes')
    .select('*')
    .eq('story_id', storyId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching chapter summaries:', error);
    return [];
  }

  // Cast to access potential chapter_summary field
  type NodeWithSummary = { id: string; node_key: string; chapter_summary?: string };
  return ((data || []) as unknown as NodeWithSummary[])
    .filter((node) => node.chapter_summary)
    .map((node) => ({
      nodeId: node.id,
      nodeKey: node.node_key,
      summary: node.chapter_summary || '',
    }));
}

// ============================================
// Image Context Management
// ============================================

/**
 * Build image context from story memory and outline
 */
export function buildImageContext(
  memory: StoryMemory,
  outline: StoryOutline,
  currentSceneText: string,
  previousPrompts: string[] = []
): ImageContext {
  return {
    characterAppearances: memory.characters.map((char) => ({
      name: char.name,
      fullDescription: `${char.name}: ${char.age ? char.age + ', ' : ''}${char.appearance}, wearing ${char.clothing}`,
    })),
    settingDescription: `${memory.setting.currentLocation}. ${outline.setting.atmosphere}`,
    artStyle: '', // Will be set by the caller
    colorPalette: [], // Will be extracted from outline
    consistentElements: outline.setting.consistentElements,
    previousImagePrompts: previousPrompts.slice(-3),
    currentSceneDescription: currentSceneText,
  };
}

/**
 * Save image context to a story node
 * Note: image_context column may not exist yet - operation may fail silently
 */
export async function saveImageContext(nodeId: string, imageContext: ImageContext): Promise<void> {
  const { error } = await supabase
    .from('story_nodes')
    .update({ image_context: imageContext } as Record<string, unknown>)
    .eq('id', nodeId);

  if (error) {
    console.error('Error saving image context:', error);
    // Don't throw - column may not exist yet
  }
}

/**
 * Get image context from a story node
 * Note: image_context column may not exist yet - returns null if not available
 */
export async function getImageContext(nodeId: string): Promise<ImageContext | null> {
  const { data, error } = await supabase
    .from('story_nodes')
    .select('*')
    .eq('id', nodeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Cast to access potential image_context field
  const nodeData = data as unknown as { image_context?: ImageContext };
  return nodeData.image_context || null;
}

/**
 * Get the last N image prompts used for a story
 */
export async function getRecentImagePrompts(storyId: string, limit: number = 3): Promise<string[]> {
  const { data, error } = await supabase
    .from('story_nodes')
    .select('image_prompt')
    .eq('story_id', storyId)
    .not('image_prompt', 'is', null)
    .order('order_index', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent image prompts:', error);
    return [];
  }

  return (data || [])
    .map((node) => node.image_prompt)
    .filter((prompt): prompt is string => !!prompt)
    .reverse();
}

// ============================================
// Context Building for AI Prompts
// ============================================

/**
 * Build context string for story continuation
 */
export function buildStoryContext(
  memory: StoryMemory,
  outline: StoryOutline,
  targetChapter: number
): string {
  const chapterOutline = outline.chapters[targetChapter - 1];

  // Get key events summary
  const recentEvents = memory.keyEvents
    .filter((e) => e.importance !== 'minor')
    .slice(-5)
    .map((e) => `Ch${e.chapter}: ${e.event}`)
    .join('; ');

  // Get unresolved threads
  const unresolvedList = memory.unresolvedThreads.map((t) => t.description).join('; ');

  // Build character context
  const characterContext = memory.characters
    .map((c) => `${c.name} (${c.role}): ${c.appearance}, ${c.clothing}`)
    .join('\n');

  return `
STORY MEMORY (DO NOT CONTRADICT):
Characters:
${characterContext}

Key events so far: ${recentEvents || 'Story just beginning'}

Unresolved plot threads: ${unresolvedList || 'None yet'}

Current conflict: ${memory.currentConflict}

Current location: ${memory.setting.currentLocation}

CHAPTER ${targetChapter} REQUIREMENTS:
Title: ${chapterOutline?.title || 'Continuation'}
Key event that MUST happen: ${chapterOutline?.keyEvent || 'Continue the story'}
This chapter's conflict: ${chapterOutline?.conflict || memory.currentConflict}
Emotional beat: ${chapterOutline?.emotionalBeat || 'Building tension'}
Must reference: ${chapterOutline?.mustReference?.join(', ') || 'Previous events'}
`.trim();
}

/**
 * Build image prompt context for consistent visuals
 */
export function buildImagePromptContext(imageContext: ImageContext): string {
  const characterDescriptions = imageContext.characterAppearances
    .map((c) => `- ${c.fullDescription}`)
    .join('\n');

  return `
CHARACTER CONSISTENCY (MUST MATCH EXACTLY):
${characterDescriptions}

SETTING: ${imageContext.settingDescription}

CONSISTENT ELEMENTS: ${imageContext.consistentElements.join(', ')}

${
  imageContext.previousImagePrompts.length > 0
    ? `STYLE REFERENCE (match these): ${imageContext.previousImagePrompts.slice(-2).join('; ')}`
    : ''
}

CURRENT SCENE: ${imageContext.currentSceneDescription}
`.trim();
}

// ============================================
// Memory Update Helpers
// ============================================

/**
 * Add a key event to memory
 */
export function addKeyEvent(
  memory: StoryMemory,
  chapter: number,
  event: string,
  importance: 'critical' | 'major' | 'minor' = 'major'
): StoryMemory {
  return {
    ...memory,
    keyEvents: [...memory.keyEvents, { chapter, event, importance }],
  };
}

/**
 * Resolve a plot thread
 */
export function resolveThread(
  memory: StoryMemory,
  threadId: string,
  resolvedInChapter: number
): StoryMemory {
  const thread = memory.unresolvedThreads.find((t) => t.id === threadId);
  if (!thread) return memory;

  return {
    ...memory,
    unresolvedThreads: memory.unresolvedThreads.filter((t) => t.id !== threadId),
    resolvedThreads: [...memory.resolvedThreads, { ...thread, resolvedInChapter }],
  };
}

/**
 * Update current location
 */
export function updateLocation(memory: StoryMemory, newLocation: string): StoryMemory {
  return {
    ...memory,
    setting: {
      currentLocation: newLocation,
      previousLocations: [
        ...memory.setting.previousLocations,
        memory.setting.currentLocation,
      ].slice(-5), // Keep last 5 locations
    },
  };
}

/**
 * Update current conflict
 */
export function updateConflict(memory: StoryMemory, newConflict: string): StoryMemory {
  return {
    ...memory,
    currentConflict: newConflict,
  };
}

/**
 * Increment chapter counter
 */
export function advanceChapter(memory: StoryMemory): StoryMemory {
  return {
    ...memory,
    currentChapter: memory.currentChapter + 1,
  };
}
