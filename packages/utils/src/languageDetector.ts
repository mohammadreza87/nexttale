/**
 * Language detection utilities
 */

const languagePatterns: Record<string, RegExp[]> = {
  fa: [/[\u0600-\u06FF]/], // Persian/Farsi
  ar: [/[\u0600-\u06FF]/], // Arabic (shares range with Persian)
  tr: [/[ğüşıöçĞÜŞİÖÇ]/], // Turkish specific characters
  zh: [/[\u4e00-\u9fff]/], // Chinese
  ja: [/[\u3040-\u309f\u30a0-\u30ff]/], // Japanese (Hiragana + Katakana)
  ko: [/[\uac00-\ud7af]/], // Korean
  ru: [/[\u0400-\u04FF]/], // Cyrillic (Russian)
  hi: [/[\u0900-\u097F]/], // Hindi
  he: [/[\u0590-\u05FF]/], // Hebrew
  th: [/[\u0E00-\u0E7F]/], // Thai
  el: [/[\u0370-\u03FF]/], // Greek
};

/**
 * Detect language from text content
 * Returns ISO 639-1 language code
 */
export function detectLanguage(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'en';
  }

  // Check for script-specific languages
  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        // Distinguish between Persian and Arabic
        if (lang === 'fa' || lang === 'ar') {
          // Persian-specific characters
          if (/[پچژگک]/.test(text)) {
            return 'fa';
          }
          return 'ar';
        }
        return lang;
      }
    }
  }

  // Default to English for Latin scripts
  return 'en';
}

/**
 * Get language flag emoji from ISO 639-1 code
 */
export function getLanguageFlag(languageCode: string | null | undefined): string {
  const flagMap: Record<string, string> = {
    en: '🇺🇸',
    tr: '🇹🇷',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    ar: '🇸🇦',
    fa: '🇮🇷',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ko: '🇰🇷',
    ru: '🇷🇺',
    pt: '🇵🇹',
    it: '🇮🇹',
    nl: '🇳🇱',
    pl: '🇵🇱',
    sv: '🇸🇪',
    hi: '🇮🇳',
    bn: '🇧🇩',
    ur: '🇵🇰',
    id: '🇮🇩',
    vi: '🇻🇳',
    th: '🇹🇭',
    uk: '🇺🇦',
    ro: '🇷🇴',
    el: '🇬🇷',
    cs: '🇨🇿',
    da: '🇩🇰',
    fi: '🇫🇮',
    no: '🇳🇴',
    he: '🇮🇱',
  };

  return flagMap[languageCode || 'en'] || '🌍';
}

/**
 * Check if language uses RTL script
 */
export function isRTL(languageCode: string | null | undefined): boolean {
  const rtlLanguages = ['ar', 'fa', 'he', 'ur'];
  return rtlLanguages.includes(languageCode || '');
}
