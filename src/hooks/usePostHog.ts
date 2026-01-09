/**
 * PostHog Hook - Access analytics tracking from any component
 */

import { useContext } from 'react';
import { PostHogContext, type PostHogContextType } from '../providers/PostHogProvider';

/**
 * Hook to access PostHog tracking methods
 */
export function usePostHog(): PostHogContextType {
  const context = useContext(PostHogContext);

  if (!context) {
    // Return no-op functions if used outside provider (SSR safety)
    return {
      identify: () => {},
      reset: () => {},
      pageView: () => {},
      signUp: () => {},
      login: () => {},
      creationStarted: () => {},
      creationCompleted: () => {},
      contentView: () => {},
      contentPlayed: () => {},
      contentShared: () => {},
      subscription: () => {},
      freeLimitHit: () => {},
      featureUsed: () => {},
      error: () => {},
      isFeatureEnabled: () => false,
      getFeatureFlag: () => undefined,
    };
  }

  return context;
}
