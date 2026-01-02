/**
 * Tracks content IDs that the user has recently seen to prevent duplicates in the feed.
 * Uses localStorage with time-based expiration.
 */

const STORAGE_KEY = 'nexttale_seen_content';
const DEFAULT_EXPIRY_MINUTES = 30;

interface SeenEntry {
  id: string;
  timestamp: number;
}

interface SeenContentData {
  entries: SeenEntry[];
}

/**
 * Get all seen content IDs that haven't expired
 */
export function getSeenContentIds(expiryMinutes: number = DEFAULT_EXPIRY_MINUTES): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed: SeenContentData = JSON.parse(data);
    const now = Date.now();
    const expiryMs = expiryMinutes * 60 * 1000;

    // Filter out expired entries
    const validEntries = parsed.entries.filter((entry) => now - entry.timestamp < expiryMs);

    // Clean up expired entries in storage
    if (validEntries.length !== parsed.entries.length) {
      saveEntries(validEntries);
    }

    return validEntries.map((e) => e.id);
  } catch {
    return [];
  }
}

/**
 * Mark content IDs as seen
 */
export function markContentAsSeen(ids: string[]): void {
  try {
    const existingIds = new Set(getSeenContentIds());
    const now = Date.now();

    const data = localStorage.getItem(STORAGE_KEY);
    const parsed: SeenContentData = data ? JSON.parse(data) : { entries: [] };

    // Add new entries for IDs not already tracked
    const newEntries = ids
      .filter((id) => !existingIds.has(id))
      .map((id) => ({ id, timestamp: now }));

    // Update timestamps for existing entries
    const updatedEntries = parsed.entries.map((entry) =>
      ids.includes(entry.id) ? { ...entry, timestamp: now } : entry
    );

    saveEntries([...updatedEntries, ...newEntries]);
  } catch (error) {
    console.error('Error marking content as seen:', error);
  }
}

/**
 * Mark a single content ID as seen
 */
export function markSingleContentAsSeen(id: string): void {
  markContentAsSeen([id]);
}

/**
 * Clear all seen content (useful for debugging or user request)
 */
export function clearSeenContent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Get count of currently tracked seen items
 */
export function getSeenContentCount(): number {
  return getSeenContentIds().length;
}

function saveEntries(entries: SeenEntry[]): void {
  // Keep only the most recent 500 entries to prevent unbounded growth
  const trimmed = entries.slice(-500);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: trimmed }));
}
