import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCachedResponse, setCachedResponse } from '../storyStreamService';

const realLocalStorage = globalThis.localStorage;

function createMemoryStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(k => delete store[k]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
    _store: store,
  };
}

describe('storyStreamService cache helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    // @ts-expect-error allow override for tests
    globalThis.localStorage = createMemoryStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.localStorage = realLocalStorage;
  });

  it('returns cached data within the valid duration', () => {
    setCachedResponse('abc', { foo: 'bar' });

    const cached = getCachedResponse('abc');

    expect(cached).toEqual({ foo: 'bar' });
  });

  it('expires stale cache after 24h and removes entry', () => {
    setCachedResponse('expired', { hello: 'world' });

    vi.advanceTimersByTime(1000 * 60 * 60 * 25); // 25 hours

    const cached = getCachedResponse('expired');

    expect(cached).toBeNull();
    expect(globalThis.localStorage.getItem('nexttale_story_cache_expired')).toBeNull();
  });
});
