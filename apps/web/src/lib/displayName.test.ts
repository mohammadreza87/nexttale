import { describe, it, expect } from 'vitest';
import { getSafeDisplayName } from './displayName';

describe('getSafeDisplayName', () => {
  it('returns the name when valid string is provided', () => {
    expect(getSafeDisplayName('John Doe')).toBe('John Doe');
  });

  it('returns fallback for null input', () => {
    expect(getSafeDisplayName(null)).toBe('Anonymous');
  });

  it('returns fallback for undefined input', () => {
    expect(getSafeDisplayName(undefined)).toBe('Anonymous');
  });

  it('returns fallback for empty string', () => {
    expect(getSafeDisplayName('')).toBe('Anonymous');
  });

  it('returns fallback for whitespace-only string', () => {
    expect(getSafeDisplayName('   ')).toBe('Anonymous');
  });

  it('trims whitespace from valid names', () => {
    expect(getSafeDisplayName('  John Doe  ')).toBe('John Doe');
  });

  it('uses custom fallback when provided', () => {
    expect(getSafeDisplayName(null, 'Guest')).toBe('Guest');
  });

  it('handles special characters in names', () => {
    expect(getSafeDisplayName("O'Connor")).toBe("O'Connor");
    expect(getSafeDisplayName('Jose Garcia')).toBe('Jose Garcia');
  });

  it('extracts local part from email addresses', () => {
    expect(getSafeDisplayName('john.doe@example.com')).toBe('john.doe');
    expect(getSafeDisplayName('user@domain.com')).toBe('user');
  });

  it('returns fallback when email has no local part', () => {
    expect(getSafeDisplayName('@example.com')).toBe('Anonymous');
  });
});
