/**
 * Shared Story Types for Edge Functions
 *
 * These types are used across multiple edge functions to ensure
 * consistent story generation with proper memory and outline tracking.
 */

// ============================================
// Character & Story Structure Types
// ============================================

export interface StoryCharacter {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  age?: string;
  appearance: string;
  clothing: string;
  personality: string;
  goal?: string;
}

export interface ChapterOutline {
  chapterNumber: number;
  title: string;
  keyEvent: string;
  conflict: string;
  emotionalBeat: string;
  endState: string;
  mustReference: string[];
}

export interface StoryOutline {
  premise: string;
  theme: string;
  setting: {
    location: string;
    timeOfDay: string;
    atmosphere: string;
    consistentElements: string[];
  };
  characters: StoryCharacter[];
  plotThreads: {
    id: string;
    description: string;
    introducedInChapter: number;
    resolvedInChapter?: number;
  }[];
  chapters: ChapterOutline[];
  resolution: string;
  totalChapters: number;
}

export interface StoryMemory {
  currentChapter: number;
  characters: StoryCharacter[];
  keyEvents: {
    chapter: number;
    event: string;
    importance: 'critical' | 'major' | 'minor';
  }[];
  currentConflict: string;
  unresolvedThreads: {
    id: string;
    description: string;
    introducedInChapter: number;
  }[];
  resolvedThreads: {
    id: string;
    description: string;
    resolvedInChapter: number;
  }[];
  setting: {
    currentLocation: string;
    previousLocations: string[];
  };
  emotionalArc: string;
  foreshadowing: string[];
}

export interface ImageContext {
  characterAppearances: {
    name: string;
    fullDescription: string;
  }[];
  settingDescription: string;
  artStyle: string;
  colorPalette: string[];
  consistentElements: string[];
  previousImagePrompts: string[];
  currentSceneDescription: string;
}

// ============================================
// AI Generation Request/Response Types
// ============================================

export interface GenerateOutlineRequest {
  userPrompt: string;
  language?: string;
  artStyle?: string;
}

export interface GenerateOutlineResponse {
  outline: StoryOutline;
  initialMemory: StoryMemory;
}

export interface GenerateChapterRequest {
  storyId: string;
  outline: StoryOutline;
  memory: StoryMemory;
  userChoice?: string;
  previousContent?: string;
  targetChapter: number;
}

export interface GenerateChapterResponse {
  content: string;
  choices: { text: string; hint: string }[];
  isEnding: boolean;
  endingType?: string;
  chapterSummary: string;
  memoryUpdates: {
    keyEvents?: { event: string; importance: 'critical' | 'major' | 'minor' }[];
    resolvedThreads?: string[];
    newLocation?: string;
    newConflict?: string;
  };
}

export interface ExtractMemoryRequest {
  chapterContent: string;
  previousMemory: StoryMemory;
  chapterNumber: number;
}

export interface ExtractMemoryResponse {
  updatedMemory: StoryMemory;
  chapterSummary: string;
}

// ============================================
// Helper Functions
// ============================================

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

export function buildStoryContextPrompt(
  memory: StoryMemory,
  outline: StoryOutline,
  targetChapter: number
): string {
  const chapterOutline = outline.chapters[targetChapter - 1];

  const recentEvents = memory.keyEvents
    .filter((e) => e.importance !== 'minor')
    .slice(-5)
    .map((e) => `Ch${e.chapter}: ${e.event}`)
    .join('; ');

  const unresolvedList = memory.unresolvedThreads.map((t) => t.description).join('; ');

  const characterContext = memory.characters
    .map((c) => `${c.name} (${c.role}): ${c.appearance}, wearing ${c.clothing}`)
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
Must reference these plot threads: ${chapterOutline?.mustReference?.join(', ') || 'Previous events'}
End state: ${chapterOutline?.endState || 'Lead to next chapter'}
`.trim();
}

export function buildImageContextPrompt(imageContext: ImageContext): string {
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

export function updateMemory(
  memory: StoryMemory,
  updates: {
    keyEvents?: { event: string; importance: 'critical' | 'major' | 'minor' }[];
    resolvedThreads?: string[];
    newLocation?: string;
    newConflict?: string;
  },
  chapterNumber: number
): StoryMemory {
  const updated = { ...memory, currentChapter: chapterNumber };

  if (updates.keyEvents) {
    updated.keyEvents = [
      ...updated.keyEvents,
      ...updates.keyEvents.map((e) => ({ ...e, chapter: chapterNumber })),
    ];
  }

  if (updates.resolvedThreads) {
    for (const threadId of updates.resolvedThreads) {
      const thread = updated.unresolvedThreads.find((t) => t.id === threadId);
      if (thread) {
        updated.unresolvedThreads = updated.unresolvedThreads.filter((t) => t.id !== threadId);
        updated.resolvedThreads = [
          ...updated.resolvedThreads,
          { ...thread, resolvedInChapter: chapterNumber },
        ];
      }
    }
  }

  if (updates.newLocation) {
    updated.setting = {
      currentLocation: updates.newLocation,
      previousLocations: [
        ...updated.setting.previousLocations,
        updated.setting.currentLocation,
      ].slice(-5),
    };
  }

  if (updates.newConflict) {
    updated.currentConflict = updates.newConflict;
  }

  return updated;
}
