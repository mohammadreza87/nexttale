import { describe, it, expect } from 'vitest';
import { detectLanguage } from './languageDetector';

describe('detectLanguage', () => {
  it('detects English text (default fallback)', () => {
    expect(detectLanguage('Hello, how are you?')).toBe('en');
  });

  it('detects Turkish text', () => {
    expect(detectLanguage('Merhaba, nasılsınız?')).toBe('tr');
  });

  it('detects Persian/Farsi text with Persian words', () => {
    expect(detectLanguage('سلام خوبی')).toBe('fa');
  });

  it('detects Arabic text with Arabic words', () => {
    expect(detectLanguage('مرحبا شكرا')).toBe('ar');
  });

  it('detects Chinese text', () => {
    expect(detectLanguage('你好，你好吗？')).toBe('zh');
  });

  it('detects Japanese text', () => {
    expect(detectLanguage('こんにちは、お元気ですか？')).toBe('ja');
  });

  it('detects Russian text', () => {
    expect(detectLanguage('Привет, как дела?')).toBe('ru');
  });

  it('detects French text', () => {
    expect(detectLanguage('Bonjour merci beaucoup')).toBe('fr');
  });

  it('detects Spanish text', () => {
    expect(detectLanguage('Hola gracias señor')).toBe('es');
  });

  it('detects German text', () => {
    // Use German-specific words that the detector matches
    expect(detectLanguage('Hallo, wie gehts?')).toBe('de');
    expect(detectLanguage('Danke sehr')).toBe('de');
    expect(detectLanguage('Straße')).toBe('de'); // ß is German-specific
  });

  it('detects Polish text', () => {
    expect(detectLanguage('Cześć dziękuję')).toBe('pl');
  });

  it('returns English for empty string', () => {
    expect(detectLanguage('')).toBe('en');
  });

  it('returns English for null/undefined', () => {
    expect(detectLanguage(null)).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });

  it('uses custom fallback when provided', () => {
    expect(detectLanguage('', 'de')).toBe('de');
    expect(detectLanguage(null, 'fr')).toBe('fr');
  });
});
