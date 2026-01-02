export function getSafeDisplayName(name?: string | null, fallback: string = 'Anonymous'): string {
  if (!name) return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  if (trimmed.includes('@')) {
    const [localPart] = trimmed.split('@');
    return localPart || fallback;
  }
  return trimmed;
}

