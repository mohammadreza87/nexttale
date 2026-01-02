// Lightweight language detector: checks for presence of common characters/words.
// Not perfect, but avoids adding heavy dependencies. Default fallback is 'en'.
const languageHints: Array<{ code: string; patterns: RegExp[] }> = [
  // Order matters: prioritize language-specific words before shared diacritics
  { code: 'tr', patterns: [/merhaba/i, /teşekkür/i, /ş|ı|ğ|ç|ö|ü/i] },
  { code: 'fr', patterns: [/bonjour/i, /merci/i, /é|è|à|ç|ù|â|ê|î|ô|û|ë|ï|ü|œ|æ/i] },
  { code: 'es', patterns: [/hola/i, /gracias/i, /ñ|á|é|í|ó|ú|ü/i] },
  { code: 'de', patterns: [/hallo/i, /danke/i, /ä|ö|ü|ß/i] },
  { code: 'pt', patterns: [/olá/i, /obrigado/i, /ã|õ|á|é|í|ó|ú|ç/i] },
  { code: 'it', patterns: [/ciao/i, /grazie/i, /à|è|é|ì|ò|ù/i] },
  { code: 'pl', patterns: [/cześć/i, /dziękuję/i, /ą|ć|ę|ł|ń|ó|ś|ź|ż/i] },
  // Order matters for scripts shared by multiple languages; check Arabic first with Arabic-only words
  // Check Arabic first with Arabic-only words
  { code: 'ar', patterns: [/مرحبا|شكرا|الحمد/i] },
  // Persian-specific words
  { code: 'fa', patterns: [/سلام|خوبی|سپاس|ممنون/i] }, // Persian (Farsi)
  // Generic Arabic script fallback (covers ar/fa if no word match)
  { code: 'ar', patterns: [/[\u0600-\u06FF]/] },
  { code: 'ru', patterns: [/[\u0400-\u04FF]/, /привет|спасибо/i] },
  { code: 'ja', patterns: [/[\u3040-\u30FF]/] },
  { code: 'zh', patterns: [/[\u4E00-\u9FFF]/] },
  { code: 'hi', patterns: [/[\u0900-\u097F]/] }, // Hindi / Devanagari
];

export function detectLanguage(input: string | null | undefined, fallback: string = 'en'): string {
  if (!input) return fallback;
  const text = input.trim();
  if (!text) return fallback;

  for (const hint of languageHints) {
    if (hint.patterns.some((p) => p.test(text))) {
      return hint.code;
    }
  }
  return fallback;
}
