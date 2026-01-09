/**
 * PostHog Analytics Integration - 2025 Best Practices
 *
 * Features:
 * - Privacy-first with cookieless tracking option
 * - Automatic page view tracking
 * - User identification
 * - Feature flags ready
 * - KPI event tracking
 */

import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

let isInitialized = false;

/**
 * Initialize PostHog - call once at app startup
 */
export function initPostHog(): void {
  if (isInitialized || !POSTHOG_KEY) {
    if (!POSTHOG_KEY) {
      console.warn('[PostHog] Missing VITE_POSTHOG_KEY - analytics disabled');
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Privacy-first settings (GDPR compliant)
    person_profiles: 'identified_only', // Only create profiles for identified users
    persistence: 'localStorage+cookie',
    capture_pageview: false, // We handle this manually for SPA
    capture_pageleave: true,
    // Performance
    autocapture: true,
    disable_session_recording: false,
    // Respect Do Not Track
    respect_dnt: true,
    // Cross-domain tracking
    cross_subdomain_cookie: true,
    // Debug in development
    loaded: (_ph) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[PostHog] Initialized successfully');
      }
    },
  });

  isInitialized = true;
}

/**
 * Check if PostHog is ready
 */
export function isPostHogReady(): boolean {
  return isInitialized && !!POSTHOG_KEY;
}

// ==================== USER IDENTIFICATION ====================

/**
 * Identify a user after login/signup
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    subscription_tier?: 'free' | 'pro';
    created_at?: string;
  }
): void {
  if (!isPostHogReady()) return;

  posthog.identify(userId, properties);
}

/**
 * Reset user identity on logout
 */
export function resetUser(): void {
  if (!isPostHogReady()) return;

  posthog.reset();
}

/**
 * Set user properties without identifying
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isPostHogReady()) return;

  posthog.people.set(properties);
}

// ==================== PAGE TRACKING ====================

/**
 * Track page view - call on route changes
 */
export function trackPageView(path?: string, title?: string): void {
  if (!isPostHogReady()) return;

  posthog.capture('$pageview', {
    $current_url: path || window.location.href,
    $title: title || document.title,
  });
}

// ==================== KPI EVENTS ====================

/**
 * Track user signup
 */
export function trackSignUp(method: 'email' | 'google' | 'apple'): void {
  if (!isPostHogReady()) return;

  posthog.capture('user_signed_up', {
    method,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track user login
 */
export function trackLogin(method: 'email' | 'google' | 'apple'): void {
  if (!isPostHogReady()) return;

  posthog.capture('user_logged_in', {
    method,
  });
}

/**
 * Track game/content creation started
 */
export function trackCreationStarted(contentType: 'game' | 'story' | 'quiz' | 'interactive'): void {
  if (!isPostHogReady()) return;

  posthog.capture('creation_started', {
    content_type: contentType,
  });
}

/**
 * Track game/content creation completed - KEY KPI
 */
export function trackCreationCompleted(
  contentType: 'game' | 'story' | 'quiz' | 'interactive',
  contentId: string,
  properties?: {
    title?: string;
    prompt_length?: number;
    generation_time_ms?: number;
  }
): void {
  if (!isPostHogReady()) return;

  posthog.capture('creation_completed', {
    content_type: contentType,
    content_id: contentId,
    ...properties,
  });
}

/**
 * Track content view
 */
export function trackContentView(
  contentType: 'game' | 'story' | 'interactive',
  contentId: string,
  title?: string
): void {
  if (!isPostHogReady()) return;

  posthog.capture('content_viewed', {
    content_type: contentType,
    content_id: contentId,
    title,
  });
}

/**
 * Track content played/started
 */
export function trackContentPlayed(
  contentType: 'game' | 'story' | 'interactive',
  contentId: string
): void {
  if (!isPostHogReady()) return;

  posthog.capture('content_played', {
    content_type: contentType,
    content_id: contentId,
  });
}

/**
 * Track content shared
 */
export function trackContentShared(
  contentType: 'game' | 'story' | 'interactive',
  contentId: string,
  method: 'copy' | 'native' | 'embed'
): void {
  if (!isPostHogReady()) return;

  posthog.capture('content_shared', {
    content_type: contentType,
    content_id: contentId,
    share_method: method,
  });
}

/**
 * Track subscription events - REVENUE KPI
 */
export function trackSubscriptionEvent(
  event: 'viewed' | 'checkout_started' | 'completed' | 'cancelled',
  plan?: 'monthly' | 'annual',
  properties?: Record<string, unknown>
): void {
  if (!isPostHogReady()) return;

  posthog.capture(`subscription_${event}`, {
    plan,
    ...properties,
  });
}

/**
 * Track free tier limit hit - CONVERSION SIGNAL
 */
export function trackFreeLimitHit(limitType: 'games' | 'stories' | 'ai_calls'): void {
  if (!isPostHogReady()) return;

  posthog.capture('free_limit_hit', {
    limit_type: limitType,
  });
}

// ==================== PITCH DECK TRACKING ====================

/**
 * Track pitch deck slide view
 */
export function trackPitchDeckSlide(
  slideNumber: number,
  slideTitle: string,
  language: 'en' | 'ar'
): void {
  if (!isPostHogReady()) return;

  posthog.capture('pitch_deck_slide_viewed', {
    slide_number: slideNumber,
    slide_title: slideTitle,
    language,
  });
}

/**
 * Track pitch deck completion
 */
export function trackPitchDeckCompleted(language: 'en' | 'ar', totalTimeSeconds: number): void {
  if (!isPostHogReady()) return;

  posthog.capture('pitch_deck_completed', {
    language,
    total_time_seconds: totalTimeSeconds,
  });
}

/**
 * Track pitch deck PDF export
 */
export function trackPitchDeckExport(language: 'en' | 'ar'): void {
  if (!isPostHogReady()) return;

  posthog.capture('pitch_deck_exported', {
    language,
    format: 'pdf',
  });
}

// ==================== ENGAGEMENT METRICS ====================

/**
 * Track user retention event - call on each session start
 */
export function trackSessionStart(): void {
  if (!isPostHogReady()) return;

  posthog.capture('session_started', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsed(featureName: string, properties?: Record<string, unknown>): void {
  if (!isPostHogReady()) return;

  posthog.capture('feature_used', {
    feature_name: featureName,
    ...properties,
  });
}

// ==================== ERROR TRACKING ====================

/**
 * Track errors for debugging
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  context?: Record<string, unknown>
): void {
  if (!isPostHogReady()) return;

  posthog.capture('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    ...context,
  });
}

// ==================== FEATURE FLAGS ====================

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (!isPostHogReady()) return false;

  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag value
 */
export function getFeatureFlag(flagKey: string): string | boolean | undefined {
  if (!isPostHogReady()) return undefined;

  return posthog.getFeatureFlag(flagKey);
}

// Export posthog instance for advanced usage
export { posthog };
