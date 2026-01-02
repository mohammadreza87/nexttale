import { describe, it, expect } from 'vitest';
import { CONTENT_TYPE_INFO } from '../interactiveTypes';
import type {
  ContentType,
  InteractiveContentType,
  FeedItem,
  InteractiveContent,
} from '../interactiveTypes';

describe('interactiveTypes', () => {
  describe('CONTENT_TYPE_INFO', () => {
    it('should have all interactive content types', () => {
      const expectedTypes: InteractiveContentType[] = [
        'game',
        'tool',
        'widget',
        'quiz',
        'visualization',
      ];

      expectedTypes.forEach((type) => {
        expect(CONTENT_TYPE_INFO[type]).toBeDefined();
        expect(CONTENT_TYPE_INFO[type].type).toBe(type);
        expect(CONTENT_TYPE_INFO[type].label).toBeTruthy();
        expect(CONTENT_TYPE_INFO[type].icon).toBeTruthy();
        expect(CONTENT_TYPE_INFO[type].description).toBeTruthy();
        expect(CONTENT_TYPE_INFO[type].color).toBeTruthy();
      });
    });

    it('should have correct game config', () => {
      expect(CONTENT_TYPE_INFO.game.label).toBe('Game');
      expect(CONTENT_TYPE_INFO.game.icon).toBe('Gamepad2');
    });

    it('should have correct tool config', () => {
      expect(CONTENT_TYPE_INFO.tool.label).toBe('Tool');
      expect(CONTENT_TYPE_INFO.tool.icon).toBe('Wrench');
    });
  });

  describe('ContentType', () => {
    it('should accept all valid content types', () => {
      const validTypes: ContentType[] = [
        'story',
        'game',
        'tool',
        'widget',
        'quiz',
        'visualization',
        'music',
      ];

      validTypes.forEach((type) => {
        const testType: ContentType = type;
        expect(testType).toBe(type);
      });
    });
  });

  describe('FeedItem type', () => {
    it('should accept a valid story feed item', () => {
      const storyItem: FeedItem = {
        id: 'story-1',
        title: 'Test Story',
        description: 'A test story',
        feed_type: 'story',
        thumbnail_url: 'https://example.com/thumb.jpg',
        preview_url: null,
        created_by: 'user-1',
        is_public: true,
        likes_count: 10,
        dislikes_count: 2,
        view_count: 100,
        comment_count: 5,
        created_at: '2024-01-01T00:00:00Z',
        estimated_duration: 300,
      };

      expect(storyItem.feed_type).toBe('story');
      expect(storyItem.id).toBe('story-1');
    });

    it('should accept a valid music feed item', () => {
      const musicItem: FeedItem = {
        id: 'music-1',
        title: 'Test Song',
        description: 'A test song',
        feed_type: 'music',
        thumbnail_url: null,
        preview_url: null,
        created_by: 'user-1',
        is_public: true,
        likes_count: 50,
        dislikes_count: 5,
        view_count: 500,
        comment_count: 20,
        created_at: '2024-01-01T00:00:00Z',
        estimated_duration: 180,
        audio_url: 'https://example.com/song.mp3',
        lyrics: 'La la la',
        genre: 'pop',
        mood: 'happy',
        play_count: 1000,
      };

      expect(musicItem.feed_type).toBe('music');
      expect(musicItem.audio_url).toBe('https://example.com/song.mp3');
      expect(musicItem.genre).toBe('pop');
    });

    it('should accept a valid interactive feed item', () => {
      const gameItem: FeedItem = {
        id: 'game-1',
        title: 'Test Game',
        description: 'A test game',
        feed_type: 'game',
        thumbnail_url: 'https://example.com/game.jpg',
        preview_url: null,
        created_by: 'user-1',
        is_public: true,
        likes_count: 100,
        dislikes_count: 10,
        view_count: 1000,
        comment_count: 50,
        created_at: '2024-01-01T00:00:00Z',
        estimated_duration: 600,
        html_content: '<html><body>Game</body></html>',
        tags: ['puzzle', 'casual'],
      };

      expect(gameItem.feed_type).toBe('game');
      expect(gameItem.html_content).toBeTruthy();
      expect(gameItem.tags).toHaveLength(2);
    });
  });

  describe('InteractiveContent type', () => {
    it('should accept valid interactive content', () => {
      const content: InteractiveContent = {
        id: 'content-1',
        title: 'Interactive Widget',
        description: 'A useful widget',
        content_type: 'widget',
        thumbnail_url: null,
        preview_gif_url: null,
        html_content: '<html><body>Widget</body></html>',
        generation_prompt: 'Create a widget',
        generation_model: 'claude-sonnet',
        created_by: 'user-1',
        is_public: true,
        likes_count: 25,
        dislikes_count: 3,
        view_count: 200,
        share_count: 10,
        comment_count: 8,
        tags: ['utility'],
        category: 'tools',
        estimated_interaction_time: 60,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      expect(content.content_type).toBe('widget');
      expect(content.html_content).toBeTruthy();
    });
  });
});
