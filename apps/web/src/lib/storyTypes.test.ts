/**
 * Integration Tests for Story Types
 *
 * Tests the type definitions and ensures they work correctly together
 * for the story memory and outline system.
 */

import { describe, it, expect } from 'vitest';
import type {
  StoryCharacter,
  ChapterOutline,
  StoryOutline,
  StoryMemory,
  ImageContext,
  StoryNodeWithMemory,
  StoryWithMemory,
} from './types';

describe('Story Types', () => {
  describe('StoryCharacter', () => {
    it('should accept valid character data', () => {
      const character: StoryCharacter = {
        name: 'Max',
        role: 'protagonist',
        age: '10',
        appearance: 'tall, blonde hair, blue eyes',
        clothing: 'green jacket, brown pants',
        personality: 'adventurous',
        goal: 'Explore the world',
      };

      expect(character.name).toBe('Max');
      expect(character.role).toBe('protagonist');
    });

    it('should allow optional age and goal', () => {
      const character: StoryCharacter = {
        name: 'Helper',
        role: 'supporting',
        appearance: 'small and round',
        clothing: 'none',
        personality: 'helpful',
      };

      expect(character.age).toBeUndefined();
      expect(character.goal).toBeUndefined();
    });
  });

  describe('ChapterOutline', () => {
    it('should accept valid chapter outline', () => {
      const chapter: ChapterOutline = {
        chapterNumber: 1,
        title: 'The Beginning',
        keyEvent: 'Hero discovers the map',
        conflict: 'The map is torn',
        emotionalBeat: 'excitement and curiosity',
        endState: 'Hero decides to find the missing pieces',
        mustReference: ['map_discovery', 'torn_map'],
      };

      expect(chapter.chapterNumber).toBe(1);
      expect(chapter.mustReference).toHaveLength(2);
    });
  });

  describe('StoryOutline', () => {
    it('should accept complete story outline', () => {
      const outline: StoryOutline = {
        premise: 'A young wizard learns magic',
        theme: 'growth and learning',
        setting: {
          location: 'Magic Academy',
          timeOfDay: 'morning',
          atmosphere: 'mystical',
          consistentElements: ['floating candles', 'stone walls'],
        },
        characters: [
          {
            name: 'Alex',
            role: 'protagonist',
            appearance: 'young, messy black hair',
            clothing: 'wizard robes',
            personality: 'curious',
          },
        ],
        plotThreads: [
          {
            id: 'magic_learning',
            description: 'Alex learns to control magic',
            introducedInChapter: 1,
          },
        ],
        chapters: [
          {
            chapterNumber: 1,
            title: 'First Day',
            keyEvent: 'Alex casts first spell',
            conflict: 'The spell goes wrong',
            emotionalBeat: 'nervousness',
            endState: 'Alex must fix the problem',
            mustReference: ['magic_learning'],
          },
        ],
        resolution: 'Alex masters basic magic',
        totalChapters: 4,
      };

      expect(outline.premise).toBeTruthy();
      expect(outline.characters).toHaveLength(1);
      expect(outline.plotThreads).toHaveLength(1);
    });

    it('should allow resolved chapter in plot threads', () => {
      const outline: StoryOutline = {
        premise: 'Adventure story',
        theme: 'friendship',
        setting: {
          location: 'Forest',
          timeOfDay: 'afternoon',
          atmosphere: 'peaceful',
          consistentElements: ['trees'],
        },
        characters: [],
        plotThreads: [
          {
            id: 'thread_1',
            description: 'Mystery to solve',
            introducedInChapter: 1,
            resolvedInChapter: 3,
          },
        ],
        chapters: [],
        resolution: 'Happy ending',
        totalChapters: 4,
      };

      expect(outline.plotThreads[0].resolvedInChapter).toBe(3);
    });
  });

  describe('StoryMemory', () => {
    it('should accept complete story memory', () => {
      const memory: StoryMemory = {
        currentChapter: 2,
        characters: [
          {
            name: 'Hero',
            role: 'protagonist',
            appearance: 'brave looking',
            clothing: 'armor',
            personality: 'courageous',
          },
        ],
        keyEvents: [
          { chapter: 1, event: 'Journey begins', importance: 'critical' },
          { chapter: 2, event: 'Found ally', importance: 'major' },
        ],
        currentConflict: 'Dragon blocks the path',
        unresolvedThreads: [
          { id: 'dragon', description: 'Defeat the dragon', introducedInChapter: 2 },
        ],
        resolvedThreads: [
          { id: 'ally', description: 'Find an ally', resolvedInChapter: 2 },
        ],
        setting: {
          currentLocation: 'Dragon Mountain',
          previousLocations: ['Village', 'Forest'],
        },
        emotionalArc: 'rising tension',
        foreshadowing: ['Dragon has a weakness'],
      };

      expect(memory.keyEvents).toHaveLength(2);
      expect(memory.unresolvedThreads).toHaveLength(1);
      expect(memory.resolvedThreads).toHaveLength(1);
    });

    it('should track different event importance levels', () => {
      const memory: StoryMemory = {
        currentChapter: 3,
        characters: [],
        keyEvents: [
          { chapter: 1, event: 'Story begins', importance: 'critical' },
          { chapter: 2, event: 'Side quest', importance: 'minor' },
          { chapter: 3, event: 'Main conflict', importance: 'major' },
        ],
        currentConflict: 'The challenge',
        unresolvedThreads: [],
        resolvedThreads: [],
        setting: {
          currentLocation: 'Here',
          previousLocations: [],
        },
        emotionalArc: 'climax',
        foreshadowing: [],
      };

      const criticalEvents = memory.keyEvents.filter(e => e.importance === 'critical');
      const majorEvents = memory.keyEvents.filter(e => e.importance === 'major');
      const minorEvents = memory.keyEvents.filter(e => e.importance === 'minor');

      expect(criticalEvents).toHaveLength(1);
      expect(majorEvents).toHaveLength(1);
      expect(minorEvents).toHaveLength(1);
    });
  });

  describe('ImageContext', () => {
    it('should accept complete image context', () => {
      const context: ImageContext = {
        characterAppearances: [
          { name: 'Luna', fullDescription: 'Luna: young girl with red dress' },
        ],
        settingDescription: 'Magical forest with glowing trees',
        artStyle: 'fantasy illustration',
        colorPalette: ['green', 'gold', 'purple'],
        consistentElements: ['floating lights', 'mushrooms'],
        previousImagePrompts: ['Scene 1 prompt', 'Scene 2 prompt'],
        currentSceneDescription: 'Luna discovers a hidden cave',
      };

      expect(context.characterAppearances).toHaveLength(1);
      expect(context.colorPalette).toHaveLength(3);
      expect(context.previousImagePrompts).toHaveLength(2);
    });
  });

  describe('Extended Types', () => {
    it('StoryNodeWithMemory should extend StoryNode', () => {
      const node: StoryNodeWithMemory = {
        id: 'node-1',
        story_id: 'story-1',
        node_key: 'start',
        content: 'Once upon a time...',
        is_ending: false,
        ending_type: null,
        order_index: 0,
        // Extended fields
        chapter_summary: 'The adventure begins',
        character_states: { Luna: 'excited and ready' },
        image_context: {
          characterAppearances: [],
          settingDescription: '',
          artStyle: '',
          colorPalette: [],
          consistentElements: [],
          previousImagePrompts: [],
          currentSceneDescription: '',
        },
      };

      expect(node.chapter_summary).toBe('The adventure begins');
      expect(node.character_states?.Luna).toBe('excited and ready');
    });

    it('StoryWithMemory should extend Story', () => {
      const story: StoryWithMemory = {
        id: 'story-1',
        title: 'The Adventure',
        description: 'An exciting tale',
        cover_image_url: null,
        age_range: '5-10',
        estimated_duration: 15,
        // Extended fields
        story_outline: {
          premise: 'Adventure awaits',
          theme: 'courage',
          setting: {
            location: 'Fantasy world',
            timeOfDay: 'day',
            atmosphere: 'exciting',
            consistentElements: [],
          },
          characters: [],
          plotThreads: [],
          chapters: [],
          resolution: 'Happy ending',
          totalChapters: 4,
        },
        story_memory: {
          currentChapter: 1,
          characters: [],
          keyEvents: [],
          currentConflict: '',
          unresolvedThreads: [],
          resolvedThreads: [],
          setting: { currentLocation: '', previousLocations: [] },
          emotionalArc: 'beginning',
          foreshadowing: [],
        },
        art_style: 'fantasy',
      };

      expect(story.story_outline?.premise).toBe('Adventure awaits');
      expect(story.story_memory?.currentChapter).toBe(1);
    });
  });
});

describe('Type Validation Scenarios', () => {
  it('should support full story generation workflow types', () => {
    // Simulate the full workflow
    const outline: StoryOutline = {
      premise: 'A child befriends a dragon',
      theme: 'unlikely friendships',
      setting: {
        location: 'Mountain village',
        timeOfDay: 'sunset',
        atmosphere: 'warm and inviting',
        consistentElements: ['snowy peaks', 'wooden houses', 'dragon shadows'],
      },
      characters: [
        {
          name: 'Sam',
          role: 'protagonist',
          age: '7 years old',
          appearance: 'small, rosy cheeks, messy brown hair',
          clothing: 'wool sweater, warm boots',
          personality: 'kind, brave, gentle',
          goal: 'Make a friend',
        },
        {
          name: 'Ember',
          role: 'supporting',
          age: 'young dragon (100 years)',
          appearance: 'small red dragon, golden eyes, tiny wings',
          clothing: 'natural scales',
          personality: 'shy, curious, playful',
          goal: 'Find acceptance',
        },
      ],
      plotThreads: [
        { id: 'friendship', description: 'Sam and Ember become friends', introducedInChapter: 1 },
        { id: 'village_fear', description: 'Village is afraid of dragons', introducedInChapter: 1 },
        { id: 'acceptance', description: 'Village learns to accept Ember', introducedInChapter: 3 },
      ],
      chapters: [
        {
          chapterNumber: 1,
          title: 'The Unexpected Meeting',
          keyEvent: 'Sam discovers Ember hiding in a cave',
          conflict: 'Ember is scared of humans',
          emotionalBeat: 'wonder and gentleness',
          endState: 'Sam offers Ember some bread',
          mustReference: ['friendship', 'village_fear'],
        },
        {
          chapterNumber: 2,
          title: 'Secret Friends',
          keyEvent: 'Sam and Ember play together secretly',
          conflict: 'Sam must hide their friendship from the village',
          emotionalBeat: 'joy mixed with worry',
          endState: 'Someone spots Ember',
          mustReference: ['friendship', 'village_fear'],
        },
        {
          chapterNumber: 3,
          title: 'The Truth Revealed',
          keyEvent: 'Sam defends Ember to the village',
          conflict: 'Village council must decide about Ember',
          emotionalBeat: 'courage and hope',
          endState: 'Village decides to give Ember a chance',
          mustReference: ['village_fear', 'acceptance'],
        },
        {
          chapterNumber: 4,
          title: 'A New Beginning',
          keyEvent: 'Ember saves the village from a storm',
          conflict: 'None - resolution',
          emotionalBeat: 'triumph and belonging',
          endState: 'Ember is welcomed as part of the village',
          mustReference: ['friendship', 'acceptance'],
        },
      ],
      resolution: 'The village welcomes Ember, and Sam has made a lifelong friend',
      totalChapters: 4,
    };

    // Initialize memory
    const initialMemory: StoryMemory = {
      currentChapter: 0,
      characters: outline.characters,
      keyEvents: [],
      currentConflict: outline.chapters[0].conflict,
      unresolvedThreads: outline.plotThreads.map(pt => ({
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

    // Simulate chapter progression
    let memory = { ...initialMemory };

    // After chapter 1
    memory = {
      ...memory,
      currentChapter: 1,
      keyEvents: [
        ...memory.keyEvents,
        { chapter: 1, event: 'Sam discovered Ember hiding in a cave and offered bread', importance: 'critical' },
      ],
      setting: {
        ...memory.setting,
        currentLocation: 'Mountain cave near the village',
        previousLocations: [...memory.setting.previousLocations, memory.setting.currentLocation],
      },
    };

    expect(memory.currentChapter).toBe(1);
    expect(memory.keyEvents).toHaveLength(1);
    expect(memory.characters).toHaveLength(2);

    // Image context for chapter 1
    const imageContext: ImageContext = {
      characterAppearances: memory.characters.map(c => ({
        name: c.name,
        fullDescription: `${c.name}: ${c.age || ''}, ${c.appearance}, ${c.clothing}`,
      })),
      settingDescription: memory.setting.currentLocation,
      artStyle: 'fantasy watercolor',
      colorPalette: ['warm orange', 'soft red', 'earthy brown'],
      consistentElements: outline.setting.consistentElements,
      previousImagePrompts: [],
      currentSceneDescription: 'Sam, a small child in a wool sweater, offers bread to Ember, a tiny red dragon with golden eyes, inside a cozy mountain cave.',
    };

    expect(imageContext.characterAppearances).toHaveLength(2);
    expect(imageContext.characterAppearances[0].name).toBe('Sam');
    expect(imageContext.characterAppearances[1].name).toBe('Ember');
  });
});
