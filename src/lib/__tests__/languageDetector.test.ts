import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../languageDetector';

describe('languageDetector', () => {
  it('falls back to en on empty input', () => {
    expect(detectLanguage('', 'en')).toBe('en');
    expect(detectLanguage(null as unknown as string, 'en')).toBe('en');
  });

  it('detects French accents/words', () => {
    expect(detectLanguage('Bonjour, merci beaucoup')).toBe('fr');
    expect(detectLanguage('école', 'en')).toBe('fr');
  });

  it('detects Turkish', () => {
    expect(detectLanguage('Merhaba, teşekkür ederim')).toBe('tr');
  });

  it('detects Polish', () => {
    expect(detectLanguage('Cześć, dziękuję za pomoc')).toBe('pl');
  });

  it('detects Persian (Farsi) script/words', () => {
    expect(detectLanguage('سلام دوست من')).toBe('fa');
    expect(detectLanguage('سپاس از شما')).toBe('fa');
  });

  it('detects Arabic script/words', () => {
    expect(detectLanguage('مرحبا كيف حالك')).toBe('ar');
    expect(detectLanguage('شكرا جزيلا')).toBe('ar');
  });

  it('detects Chinese characters', () => {
    expect(detectLanguage('你好，朋友', 'en')).toBe('zh');
  });

  it('defaults when no patterns match', () => {
    expect(detectLanguage('This is plain English text', 'en')).toBe('en');
  });
});
