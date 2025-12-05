/**
 * Unit Tests for Story Memory Service
 *
 * Tests the core functionality of story memory management including:
 * - Memory initialization from outline
 * - Memory updates (events, threads, location, conflict)
 * - Context building for AI prompts
 * - Image context management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock supabase before importing storyMemoryService
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

import type {
  StoryOutline,
  StoryMemory,
  StoryCharacter,
  ChapterOutline,
  ImageContext,
} from './types';
import {
  initializeMemoryFromOutline,
  buildImageContext,
  buildStoryContext,
  buildImagePromptContext,
  addKeyEvent,
  resolveThread,
  updateLocation,
  updateConflict,
  advanceChapter,
} from './storyMemoryService';

// ============================================
// Test Data Fixtures
// ============================================

const createTestCharacter = (overrides?: Partial<StoryCharacter>): StoryCharacter => ({
  name: 'Luna',
  role: 'protagonist',
  age: '8 years old',
  appearance: 'curly brown hair, bright green eyes, freckles on her cheeks',
  clothing: 'red hoodie with a golden star patch, blue jeans, white sneakers',
  personality: 'brave, curious, kind-hearted',
  goal: 'Find her lost puppy',
  ...overrides,
});

const createTestOutline = (overrides?: Partial<StoryOutline>): StoryOutline => ({
  premise: 'A brave girl searches for her lost puppy in a magical forest',
  theme: 'friendship and perseverance',
  setting: {
    location: 'Enchanted Forest near Willowbrook Village',
    timeOfDay: 'sunny afternoon',
    atmosphere: 'magical and whimsical with glowing flowers',
    consistentElements: ['tall oak trees', 'glowing mushrooms', 'floating butterflies'],
  },
  characters: [createTestCharacter()],
  plotThreads: [
    {
      id: 'lost_puppy',
      description: 'Luna is searching for her lost puppy Max',
      introducedInChapter: 1,
    },
    {
      id: 'magical_helper',
      description: 'A friendly fairy offers to help Luna',
      introducedInChapter: 2,
    },
  ],
  chapters: [
    {
      chapterNumber: 1,
      title: 'The Search Begins',
      keyEvent: 'Luna enters the forest and finds a clue',
      conflict: 'The forest is bigger than expected',
      emotionalBeat: 'determination mixed with worry',
      endState: 'Luna finds paw prints leading deeper into the forest',
      mustReference: ['lost_puppy'],
    },
    {
      chapterNumber: 2,
      title: 'A New Friend',
      keyEvent: 'Luna meets Sparkle the fairy',
      conflict: 'The paw prints disappear at a river',
      emotionalBeat: 'hope and friendship',
      endState: 'Sparkle agrees to help Luna fly over the river',
      mustReference: ['lost_puppy', 'magical_helper'],
    },
  ],
  resolution: 'Luna finds Max playing with forest animals and brings him home safely',
  totalChapters: 4,
  ...overrides,
});

const createTestMemory = (overrides?: Partial<StoryMemory>): StoryMemory => ({
  currentChapter: 1,
  characters: [createTestCharacter()],
  keyEvents: [
    {
      chapter: 1,
      event: 'Luna entered the Enchanted Forest looking for Max',
      importance: 'major',
    },
  ],
  currentConflict: 'Max is lost somewhere in the magical forest',
  unresolvedThreads: [
    {
      id: 'lost_puppy',
      description: 'Luna is searching for her lost puppy Max',
      introducedInChapter: 1,
    },
  ],
  resolvedThreads: [],
  setting: {
    currentLocation: 'Edge of the Enchanted Forest',
    previousLocations: ['Willowbrook Village'],
  },
  emotionalArc: 'beginning',
  foreshadowing: ['Sparkle the fairy was mentioned by a talking squirrel'],
  ...overrides,
});

// ============================================
// Test Suites
// ============================================

describe('Story Memory Service', () => {
  describe('initializeMemoryFromOutline', () => {
    it('should create initial memory with characters from outline', () => {
      const outline = createTestOutline();
      const memory = initializeMemoryFromOutline(outline);

      expect(memory.characters).toHaveLength(1);
      expect(memory.characters[0].name).toBe('Luna');
      expect(memory.characters[0].appearance).toContain('curly brown hair');
    });

    it('should set current chapter to 0', () => {
      const outline = createTestOutline();
      const memory = initializeMemoryFromOutline(outline);

      expect(memory.currentChapter).toBe(0);
    });

    it('should initialize unresolved threads from plot threads', () => {
      const outline = createTestOutline();
      const memory = initializeMemoryFromOutline(outline);

      expect(memory.unresolvedThreads).toHaveLength(2);
      expect(memory.unresolvedThreads[0].id).toBe('lost_puppy');
      expect(memory.unresolvedThreads[1].id).toBe('magical_helper');
    });

    it('should set initial conflict from first chapter', () => {
      const outline = createTestOutline();
      const memory = initializeMemoryFromOutline(outline);

      expect(memory.currentConflict).toBe('The forest is bigger than expected');
    });

    it('should set initial location from outline setting', () => {
      const outline = createTestOutline();
      const memory = initializeMemoryFromOutline(outline);

      expect(memory.setting.currentLocation).toBe('Enchanted Forest near Willowbrook Village');
      expect(memory.setting.previousLocations).toEqual([]);
    });

    it('should initialize with empty key events', () => {
      const outline = createTestOutline();
      const memory = initializeMemoryFromOutline(outline);

      expect(memory.keyEvents).toEqual([]);
    });
  });

  describe('addKeyEvent', () => {
    it('should add a new key event to memory', () => {
      const memory = createTestMemory();
      const updated = addKeyEvent(memory, 2, 'Luna met Sparkle the fairy', 'major');

      expect(updated.keyEvents).toHaveLength(2);
      expect(updated.keyEvents[1]).toEqual({
        chapter: 2,
        event: 'Luna met Sparkle the fairy',
        importance: 'major',
      });
    });

    it('should preserve existing events', () => {
      const memory = createTestMemory();
      const updated = addKeyEvent(memory, 2, 'New event', 'minor');

      expect(updated.keyEvents[0].event).toBe('Luna entered the Enchanted Forest looking for Max');
    });

    it('should not mutate original memory', () => {
      const memory = createTestMemory();
      const originalLength = memory.keyEvents.length;
      addKeyEvent(memory, 2, 'New event', 'major');

      expect(memory.keyEvents).toHaveLength(originalLength);
    });

    it('should support different importance levels', () => {
      const memory = createTestMemory();

      const updated1 = addKeyEvent(memory, 2, 'Critical event', 'critical');
      const updated2 = addKeyEvent(memory, 3, 'Minor event', 'minor');

      expect(updated1.keyEvents[1].importance).toBe('critical');
      expect(updated2.keyEvents[1].importance).toBe('minor');
    });
  });

  describe('resolveThread', () => {
    it('should move thread from unresolved to resolved', () => {
      const memory = createTestMemory();
      const updated = resolveThread(memory, 'lost_puppy', 3);

      expect(updated.unresolvedThreads).toHaveLength(0);
      expect(updated.resolvedThreads).toHaveLength(1);
      expect(updated.resolvedThreads[0].resolvedInChapter).toBe(3);
    });

    it('should preserve thread details when resolving', () => {
      const memory = createTestMemory();
      const updated = resolveThread(memory, 'lost_puppy', 3);

      expect(updated.resolvedThreads[0].id).toBe('lost_puppy');
      expect(updated.resolvedThreads[0].description).toBe('Luna is searching for her lost puppy Max');
    });

    it('should return unchanged memory if thread not found', () => {
      const memory = createTestMemory();
      const updated = resolveThread(memory, 'nonexistent_thread', 3);

      expect(updated.unresolvedThreads).toEqual(memory.unresolvedThreads);
      expect(updated.resolvedThreads).toEqual(memory.resolvedThreads);
    });

    it('should not mutate original memory', () => {
      const memory = createTestMemory();
      const originalUnresolved = memory.unresolvedThreads.length;
      resolveThread(memory, 'lost_puppy', 3);

      expect(memory.unresolvedThreads).toHaveLength(originalUnresolved);
    });
  });

  describe('updateLocation', () => {
    it('should update current location', () => {
      const memory = createTestMemory();
      const updated = updateLocation(memory, 'Deep in the Enchanted Forest');

      expect(updated.setting.currentLocation).toBe('Deep in the Enchanted Forest');
    });

    it('should add previous location to history', () => {
      const memory = createTestMemory();
      const updated = updateLocation(memory, 'Crystal River');

      expect(updated.setting.previousLocations).toContain('Edge of the Enchanted Forest');
    });

    it('should limit previous locations to last 5', () => {
      let memory = createTestMemory();
      for (let i = 0; i < 10; i++) {
        memory = updateLocation(memory, `Location ${i}`);
      }

      expect(memory.setting.previousLocations).toHaveLength(5);
    });

    it('should not mutate original memory', () => {
      const memory = createTestMemory();
      const originalLocation = memory.setting.currentLocation;
      updateLocation(memory, 'New Location');

      expect(memory.setting.currentLocation).toBe(originalLocation);
    });
  });

  describe('updateConflict', () => {
    it('should update current conflict', () => {
      const memory = createTestMemory();
      const updated = updateConflict(memory, 'A dragon blocks the path');

      expect(updated.currentConflict).toBe('A dragon blocks the path');
    });

    it('should not mutate original memory', () => {
      const memory = createTestMemory();
      const originalConflict = memory.currentConflict;
      updateConflict(memory, 'New conflict');

      expect(memory.currentConflict).toBe(originalConflict);
    });
  });

  describe('advanceChapter', () => {
    it('should increment current chapter', () => {
      const memory = createTestMemory();
      const updated = advanceChapter(memory);

      expect(updated.currentChapter).toBe(2);
    });

    it('should not mutate original memory', () => {
      const memory = createTestMemory();
      const originalChapter = memory.currentChapter;
      advanceChapter(memory);

      expect(memory.currentChapter).toBe(originalChapter);
    });
  });

  describe('buildStoryContext', () => {
    it('should include character information', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildStoryContext(memory, outline, 2);

      expect(context).toContain('Luna');
      expect(context).toContain('curly brown hair');
    });

    it('should include key events', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildStoryContext(memory, outline, 2);

      expect(context).toContain('Luna entered the Enchanted Forest');
    });

    it('should include unresolved threads', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildStoryContext(memory, outline, 2);

      expect(context).toContain('lost puppy Max');
    });

    it('should include current conflict', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildStoryContext(memory, outline, 2);

      expect(context).toContain('Max is lost');
    });

    it('should include chapter requirements from outline', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildStoryContext(memory, outline, 2);

      expect(context).toContain('CHAPTER 2');
      expect(context).toContain('A New Friend');
    });

    it('should include current location', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildStoryContext(memory, outline, 2);

      expect(context).toContain('Edge of the Enchanted Forest');
    });
  });

  describe('buildImageContext', () => {
    it('should include character appearances', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildImageContext(memory, outline, 'Luna found a glowing mushroom', []);

      expect(context.characterAppearances).toHaveLength(1);
      expect(context.characterAppearances[0].name).toBe('Luna');
      expect(context.characterAppearances[0].fullDescription).toContain('red hoodie');
    });

    it('should include setting description', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildImageContext(memory, outline, 'Scene text', []);

      expect(context.settingDescription).toContain('Edge of the Enchanted Forest');
    });

    it('should include consistent elements from outline', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const context = buildImageContext(memory, outline, 'Scene text', []);

      expect(context.consistentElements).toContain('tall oak trees');
      expect(context.consistentElements).toContain('glowing mushrooms');
    });

    it('should include previous prompts for style matching', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const previousPrompts = ['prompt 1', 'prompt 2', 'prompt 3'];
      const context = buildImageContext(memory, outline, 'Scene text', previousPrompts);

      expect(context.previousImagePrompts).toHaveLength(3);
    });

    it('should limit previous prompts to last 3', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const previousPrompts = ['prompt 1', 'prompt 2', 'prompt 3', 'prompt 4', 'prompt 5'];
      const context = buildImageContext(memory, outline, 'Scene text', previousPrompts);

      expect(context.previousImagePrompts).toHaveLength(3);
    });

    it('should include current scene description', () => {
      const memory = createTestMemory();
      const outline = createTestOutline();
      const sceneText = 'Luna discovered a magical crystal';
      const context = buildImageContext(memory, outline, sceneText, []);

      expect(context.currentSceneDescription).toBe(sceneText);
    });
  });

  describe('buildImagePromptContext', () => {
    it('should format character descriptions for image generation', () => {
      const imageContext: ImageContext = {
        characterAppearances: [
          { name: 'Luna', fullDescription: 'Luna: 8 years old, curly brown hair, wearing red hoodie' },
        ],
        settingDescription: 'Enchanted Forest',
        artStyle: 'fantasy',
        colorPalette: ['green', 'gold'],
        consistentElements: ['glowing mushrooms'],
        previousImagePrompts: [],
        currentSceneDescription: 'Luna stands in a clearing',
      };

      const prompt = buildImagePromptContext(imageContext);

      expect(prompt).toContain('Luna: 8 years old');
      expect(prompt).toContain('MUST MATCH EXACTLY');
    });

    it('should include setting information', () => {
      const imageContext: ImageContext = {
        characterAppearances: [],
        settingDescription: 'Magical Crystal Cave',
        artStyle: 'fantasy',
        colorPalette: [],
        consistentElements: [],
        previousImagePrompts: [],
        currentSceneDescription: 'The cave glows with blue light',
      };

      const prompt = buildImagePromptContext(imageContext);

      expect(prompt).toContain('Magical Crystal Cave');
    });

    it('should include style reference from previous prompts', () => {
      const imageContext: ImageContext = {
        characterAppearances: [],
        settingDescription: '',
        artStyle: 'fantasy',
        colorPalette: [],
        consistentElements: [],
        previousImagePrompts: ['Previous scene with warm lighting', 'Forest background'],
        currentSceneDescription: 'New scene',
      };

      const prompt = buildImagePromptContext(imageContext);

      expect(prompt).toContain('STYLE REFERENCE');
      expect(prompt).toContain('Previous scene');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty characters array', () => {
    const outline = createTestOutline({ characters: [] });
    const memory = initializeMemoryFromOutline(outline);

    expect(memory.characters).toEqual([]);
  });

  it('should handle empty plot threads', () => {
    const outline = createTestOutline({ plotThreads: [] });
    const memory = initializeMemoryFromOutline(outline);

    expect(memory.unresolvedThreads).toEqual([]);
  });

  it('should handle missing chapter outline gracefully', () => {
    const memory = createTestMemory();
    const outline = createTestOutline({ chapters: [] });
    const context = buildStoryContext(memory, outline, 5);

    expect(context).toContain('CHAPTER 5');
    // Should not throw and should still include memory info
    expect(context).toContain('Luna');
  });

  it('should handle multiple location updates correctly', () => {
    let memory = createTestMemory();
    memory = updateLocation(memory, 'Location A');
    memory = updateLocation(memory, 'Location B');
    memory = updateLocation(memory, 'Location C');

    expect(memory.setting.currentLocation).toBe('Location C');
    expect(memory.setting.previousLocations).toContain('Location A');
    expect(memory.setting.previousLocations).toContain('Location B');
  });

  it('should handle chaining memory updates', () => {
    let memory = createTestMemory();

    memory = addKeyEvent(memory, 2, 'Event 1', 'major');
    memory = updateLocation(memory, 'New Place');
    memory = updateConflict(memory, 'New Conflict');
    memory = advanceChapter(memory);

    expect(memory.keyEvents).toHaveLength(2);
    expect(memory.setting.currentLocation).toBe('New Place');
    expect(memory.currentConflict).toBe('New Conflict');
    expect(memory.currentChapter).toBe(2);
  });
});
