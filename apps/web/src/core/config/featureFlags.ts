/**
 * Feature Flags System
 *
 * Enables safe rollout of new features with:
 * - Boolean flags for on/off features
 * - Percentage-based rollout for gradual deployment
 * - User-specific targeting for A/B testing
 */

export type FlagName =
  | 'USE_REPOSITORY_PATTERN'
  | 'USE_OPTIMIZED_QUERIES'
  | 'ENABLE_ERROR_BOUNDARIES'
  | 'ENABLE_QUERY_HOOKS';

interface FeatureFlagsConfig {
  flags: Record<FlagName, boolean>;
  rolloutPercentages: Partial<Record<FlagName, number>>;
}

class FeatureFlags {
  private config: FeatureFlagsConfig;

  constructor() {
    this.config = {
      flags: {
        USE_REPOSITORY_PATTERN: this.getEnvFlag('VITE_FF_REPOSITORY_PATTERN', false),
        USE_OPTIMIZED_QUERIES: this.getEnvFlag('VITE_FF_OPTIMIZED_QUERIES', false),
        ENABLE_ERROR_BOUNDARIES: this.getEnvFlag('VITE_FF_ERROR_BOUNDARIES', true),
        ENABLE_QUERY_HOOKS: this.getEnvFlag('VITE_FF_QUERY_HOOKS', false),
      },
      rolloutPercentages: {
        USE_REPOSITORY_PATTERN: this.getEnvNumber('VITE_FF_REPOSITORY_PATTERN_PCT', 0),
        USE_OPTIMIZED_QUERIES: this.getEnvNumber('VITE_FF_OPTIMIZED_QUERIES_PCT', 0),
      },
    };
  }

  private getEnvFlag(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : Math.min(100, Math.max(0, num));
  }

  /**
   * Check if a feature is enabled globally
   */
  isEnabled(flag: FlagName): boolean {
    return this.config.flags[flag] ?? false;
  }

  /**
   * Check if a feature is enabled for a specific user
   * Uses deterministic hashing for consistent experience
   */
  isEnabledForUser(flag: FlagName, userId: string): boolean {
    // First check if globally enabled
    if (this.isEnabled(flag)) return true;

    // Check percentage rollout
    const percentage = this.config.rolloutPercentages[flag];
    if (percentage === undefined || percentage === 0) return false;
    if (percentage >= 100) return true;

    // Deterministic hash for consistent user experience
    const hash = this.hashUserId(userId, flag);
    return hash < percentage;
  }

  /**
   * Deterministic hash function
   * Same user + flag always returns same value (0-99)
   */
  private hashUserId(userId: string, flag: string): number {
    const str = `${userId}:${flag}`;
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash >>> 0; // Convert to unsigned 32-bit
    }

    return hash % 100;
  }

  /**
   * Get all flag states (for debugging/monitoring)
   */
  getAllFlags(): Record<FlagName, boolean> {
    return { ...this.config.flags };
  }

  /**
   * Override a flag at runtime (for testing only)
   */
  setFlag(flag: FlagName, value: boolean): void {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      this.config.flags[flag] = value;
    }
  }

  /**
   * Reset all flags to their initial state (for testing)
   */
  reset(): void {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      this.config.flags = {
        USE_REPOSITORY_PATTERN: false,
        USE_OPTIMIZED_QUERIES: false,
        ENABLE_ERROR_BOUNDARIES: true,
        ENABLE_QUERY_HOOKS: false,
      };
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlags();

// Convenience exports
export const isFeatureEnabled = (flag: FlagName): boolean => featureFlags.isEnabled(flag);

export const isFeatureEnabledForUser = (flag: FlagName, userId: string): boolean =>
  featureFlags.isEnabledForUser(flag, userId);
