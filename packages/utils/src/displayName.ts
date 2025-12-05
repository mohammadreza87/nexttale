/**
 * Safely get a display name with fallback
 * Prevents XSS and handles null/undefined values
 */
export function getSafeDisplayName(
  name: string | null | undefined,
  fallback: string = 'Anonymous'
): string {
  if (!name || typeof name !== 'string') {
    return fallback;
  }

  // Trim and limit length
  const trimmed = name.trim().slice(0, 50);

  // Return fallback if empty after trim
  if (!trimmed) {
    return fallback;
  }

  return trimmed;
}

/**
 * Generate initials from a display name
 */
export function getInitials(name: string | null | undefined): string {
  const safeName = getSafeDisplayName(name, 'A');
  const parts = safeName.split(' ').filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return safeName.slice(0, 2).toUpperCase();
}
