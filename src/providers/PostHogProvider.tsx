/**
 * PostHog Provider - React Context for Analytics
 *
 * Handles:
 * - Initialization on mount
 * - Automatic page view tracking on route changes
 * - User identification sync with auth
 */

import { createContext, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initPostHog,
  trackPageView,
  identifyUser,
  resetUser,
  trackSessionStart,
  trackSignUp as trackSignUpEvent,
  trackLogin as trackLoginEvent,
  trackCreationStarted,
  trackCreationCompleted,
  trackContentView,
  trackContentPlayed,
  trackContentShared,
  trackSubscriptionEvent,
  trackFreeLimitHit,
  trackFeatureUsed,
  trackError,
  isFeatureEnabled,
  getFeatureFlag,
} from '../lib/posthog';

// Context type with all tracking methods
export interface PostHogContextType {
  // User
  identify: typeof identifyUser;
  reset: typeof resetUser;
  // Page
  pageView: typeof trackPageView;
  // KPIs
  signUp: typeof trackSignUpEvent;
  login: typeof trackLoginEvent;
  creationStarted: typeof trackCreationStarted;
  creationCompleted: typeof trackCreationCompleted;
  contentView: typeof trackContentView;
  contentPlayed: typeof trackContentPlayed;
  contentShared: typeof trackContentShared;
  subscription: typeof trackSubscriptionEvent;
  freeLimitHit: typeof trackFreeLimitHit;
  featureUsed: typeof trackFeatureUsed;
  error: typeof trackError;
  // Feature flags
  isFeatureEnabled: typeof isFeatureEnabled;
  getFeatureFlag: typeof getFeatureFlag;
}

export const PostHogContext = createContext<PostHogContextType | null>(null);

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const location = useLocation();
  const isInitialized = useRef(false);
  const prevPathname = useRef<string | null>(null);

  // Initialize PostHog once
  useEffect(() => {
    if (!isInitialized.current) {
      initPostHog();
      trackSessionStart();
      isInitialized.current = true;
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    // Skip if same path (e.g., query param changes we don't care about)
    if (prevPathname.current === location.pathname) {
      return;
    }

    prevPathname.current = location.pathname;
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  const contextValue: PostHogContextType = {
    identify: identifyUser,
    reset: resetUser,
    pageView: trackPageView,
    signUp: trackSignUpEvent,
    login: trackLoginEvent,
    creationStarted: trackCreationStarted,
    creationCompleted: trackCreationCompleted,
    contentView: trackContentView,
    contentPlayed: trackContentPlayed,
    contentShared: trackContentShared,
    subscription: trackSubscriptionEvent,
    freeLimitHit: trackFreeLimitHit,
    featureUsed: trackFeatureUsed,
    error: trackError,
    isFeatureEnabled,
    getFeatureFlag,
  };

  return <PostHogContext.Provider value={contextValue}>{children}</PostHogContext.Provider>;
}
