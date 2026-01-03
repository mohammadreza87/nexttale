/**
 * Avatar Component
 * User avatar with fallback for when external images are blocked (COEP/CORS)
 *
 * Note: WebContainer's COEP policy blocks external images like Google avatars.
 * We detect known blocked domains and skip loading to avoid console errors.
 */

import { useState, useMemo } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

// Domains known to be blocked by WebContainer's COEP
const BLOCKED_DOMAINS = [
  'googleusercontent.com',
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
];

function isBlockedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return BLOCKED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

export function Avatar({ src, name, size = 'sm', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Check if URL is from a blocked domain (avoid network request)
  const isBlocked = useMemo(() => src ? isBlockedUrl(src) : false, [src]);

  // Get initials from name
  const getInitials = (name?: string | null) => {
    if (!name) return null;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);
  const showFallback = !src || hasError || isBlocked;

  if (showFallback) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 font-medium text-white ${sizeClasses[size]} ${className}`}
      >
        {initials || <User className={iconSizes[size]} />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'User avatar'}
      className={`rounded-full bg-gray-800 ${sizeClasses[size]} ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
