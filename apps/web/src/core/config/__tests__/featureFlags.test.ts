import { describe, it, expect, beforeEach, vi } from 'vitest';
import { featureFlags } from '../featureFlags';

describe('featureFlags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isEnabled', () => {
    it('returns false for USE_REPOSITORY_PATTERN by default', () => {
      expect(featureFlags.isEnabled('USE_REPOSITORY_PATTERN')).toBe(false);
    });

    it('returns false for USE_OPTIMIZED_QUERIES by default', () => {
      expect(featureFlags.isEnabled('USE_OPTIMIZED_QUERIES')).toBe(false);
    });

    it('returns true for ENABLE_ERROR_BOUNDARIES by default', () => {
      expect(featureFlags.isEnabled('ENABLE_ERROR_BOUNDARIES')).toBe(true);
    });

    it('returns false for ENABLE_QUERY_HOOKS by default', () => {
      expect(featureFlags.isEnabled('ENABLE_QUERY_HOOKS')).toBe(false);
    });
  });

  describe('isEnabledForUser', () => {
    it('returns false when flag is disabled', () => {
      expect(featureFlags.isEnabledForUser('USE_REPOSITORY_PATTERN', 'user-123')).toBe(false);
    });

    it('returns consistent results for same user', () => {
      const userId = 'test-user-abc';
      const flag = 'USE_REPOSITORY_PATTERN';

      const result1 = featureFlags.isEnabledForUser(flag, userId);
      const result2 = featureFlags.isEnabledForUser(flag, userId);
      const result3 = featureFlags.isEnabledForUser(flag, userId);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('returns true for all users when flag is globally enabled', () => {
      // ENABLE_ERROR_BOUNDARIES is globally enabled by default
      const flag = 'ENABLE_ERROR_BOUNDARIES';
      const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];

      // All users should get the flag since it's globally enabled
      const results = users.map((u) => featureFlags.isEnabledForUser(flag, u));
      expect(results.every((r) => r === true)).toBe(true);
    });

    it('returns consistent hash-based results for same user', () => {
      // USE_REPOSITORY_PATTERN has percentage rollout but is disabled by default
      const flag = 'USE_REPOSITORY_PATTERN';
      const userId = 'test-user-xyz';

      // Multiple calls should return same result
      const r1 = featureFlags.isEnabledForUser(flag, userId);
      const r2 = featureFlags.isEnabledForUser(flag, userId);

      expect(r1).toBe(r2);
    });
  });

  describe('getAllFlags', () => {
    it('returns complete flag states', () => {
      const flags = featureFlags.getAllFlags();

      expect(flags).toHaveProperty('USE_REPOSITORY_PATTERN');
      expect(flags).toHaveProperty('USE_OPTIMIZED_QUERIES');
      expect(flags).toHaveProperty('ENABLE_ERROR_BOUNDARIES');
      expect(flags).toHaveProperty('ENABLE_QUERY_HOOKS');

      expect(typeof flags.USE_REPOSITORY_PATTERN).toBe('boolean');
      expect(typeof flags.ENABLE_ERROR_BOUNDARIES).toBe('boolean');
    });
  });

  describe('setFlag', () => {
    it('allows setting flags in test mode', () => {
      featureFlags.setFlag('USE_REPOSITORY_PATTERN', true);
      expect(featureFlags.isEnabled('USE_REPOSITORY_PATTERN')).toBe(true);

      featureFlags.setFlag('USE_REPOSITORY_PATTERN', false);
      expect(featureFlags.isEnabled('USE_REPOSITORY_PATTERN')).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets flags to defaults', () => {
      featureFlags.setFlag('USE_REPOSITORY_PATTERN', true);
      featureFlags.setFlag('ENABLE_ERROR_BOUNDARIES', false);

      featureFlags.reset();

      expect(featureFlags.isEnabled('USE_REPOSITORY_PATTERN')).toBe(false);
      expect(featureFlags.isEnabled('ENABLE_ERROR_BOUNDARIES')).toBe(true);
    });
  });
});
