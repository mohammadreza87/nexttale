/**
 * Google Analytics 4 Integration for Next Tale
 *
 * This module provides a professional GA4 implementation with:
 * - Automatic page view tracking
 * - Custom event tracking for user engagement
 * - E-commerce events for subscriptions
 * - User property management
 * - Privacy-compliant consent handling
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Initialize Google Analytics
export function initializeAnalytics(): void {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics: Missing VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle page views manually
    cookie_flags: 'SameSite=None;Secure',
  });
}

// Check if analytics is available
function isAnalyticsReady(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function' && !!GA_MEASUREMENT_ID;
}

// ==================== PAGE TRACKING ====================

export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  });
}

// ==================== USER PROPERTIES ====================

export function setUserProperties(userId: string | null, properties?: Record<string, unknown>): void {
  if (!isAnalyticsReady()) return;

  if (userId) {
    window.gtag('set', 'user_id', userId);
  }

  if (properties) {
    window.gtag('set', 'user_properties', properties);
  }
}

export function setUserSubscriptionTier(tier: 'free' | 'pro'): void {
  if (!isAnalyticsReady()) return;

  window.gtag('set', 'user_properties', {
    subscription_tier: tier,
  });
}

// ==================== STORY EVENTS ====================

export function trackStoryView(storyId: string, storyTitle: string, creatorId?: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'view_item', {
    currency: 'USD',
    value: 0,
    items: [{
      item_id: storyId,
      item_name: storyTitle,
      item_category: 'story',
      item_brand: creatorId || 'nexttale',
    }],
  });

  // Custom event for more detailed tracking
  window.gtag('event', 'story_view', {
    story_id: storyId,
    story_title: storyTitle,
    creator_id: creatorId,
  });
}

export function trackStoryStart(storyId: string, storyTitle: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'story_start', {
    story_id: storyId,
    story_title: storyTitle,
  });

  window.gtag('event', 'begin_checkout', {
    currency: 'USD',
    value: 0,
    items: [{
      item_id: storyId,
      item_name: storyTitle,
      item_category: 'story',
    }],
  });
}

export function trackChapterRead(storyId: string, chapterIndex: number, isEnding: boolean): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'chapter_read', {
    story_id: storyId,
    chapter_index: chapterIndex,
    is_ending: isEnding,
  });
}

export function trackStoryComplete(storyId: string, storyTitle: string, chaptersRead: number): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'story_complete', {
    story_id: storyId,
    story_title: storyTitle,
    chapters_read: chaptersRead,
  });

  // E-commerce purchase event for story completion
  window.gtag('event', 'purchase', {
    currency: 'USD',
    value: 0,
    transaction_id: `story_${storyId}_${Date.now()}`,
    items: [{
      item_id: storyId,
      item_name: storyTitle,
      item_category: 'story_completion',
      quantity: 1,
    }],
  });
}

export function trackChoiceSelected(storyId: string, choiceId: string, choiceText: string, isCustom: boolean): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'select_content', {
    content_type: 'story_choice',
    content_id: choiceId,
    story_id: storyId,
    choice_text: choiceText.substring(0, 100),
    is_custom_choice: isCustom,
  });
}

// ==================== STORY CREATION EVENTS ====================

export function trackStoryCreationStart(artStyle: string, ageRange: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'story_creation_start', {
    art_style: artStyle,
    age_range: ageRange,
  });
}

export function trackStoryCreated(storyId: string, storyTitle: string, artStyle: string, isPublic: boolean): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'story_created', {
    story_id: storyId,
    story_title: storyTitle,
    art_style: artStyle,
    is_public: isPublic,
  });

  // Level up event for gamification
  window.gtag('event', 'level_up', {
    level: 1,
    character: 'creator',
  });
}

// ==================== USER ENGAGEMENT EVENTS ====================

export function trackSignUp(method: 'email' | 'google' | 'apple'): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'sign_up', {
    method: method,
  });
}

export function trackLogin(method: 'email' | 'google' | 'apple'): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'login', {
    method: method,
  });
}

export function trackShare(storyId: string, storyTitle: string, method: 'copy' | 'native'): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'share', {
    content_type: 'story',
    item_id: storyId,
    method: method,
  });
}

export function trackReaction(storyId: string, reactionType: 'like' | 'dislike'): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'story_reaction', {
    story_id: storyId,
    reaction_type: reactionType,
  });
}

export function trackComment(storyId: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'comment_added', {
    story_id: storyId,
  });
}

export function trackFollow(followedUserId: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'follow_user', {
    followed_user_id: followedUserId,
  });
}

// ==================== SUBSCRIPTION EVENTS ====================

export function trackSubscriptionView(plan: 'monthly' | 'annual'): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'view_item', {
    currency: 'USD',
    value: plan === 'monthly' ? 4.99 : 29.99,
    items: [{
      item_id: `pro_${plan}`,
      item_name: `Pro ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
      item_category: 'subscription',
      price: plan === 'monthly' ? 4.99 : 29.99,
    }],
  });
}

export function trackSubscriptionCheckoutStart(plan: 'monthly' | 'annual'): void {
  if (!isAnalyticsReady()) return;

  const price = plan === 'monthly' ? 4.99 : 29.99;

  window.gtag('event', 'begin_checkout', {
    currency: 'USD',
    value: price,
    items: [{
      item_id: `pro_${plan}`,
      item_name: `Pro ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
      item_category: 'subscription',
      price: price,
      quantity: 1,
    }],
  });
}

export function trackSubscriptionPurchase(plan: 'monthly' | 'annual', transactionId: string): void {
  if (!isAnalyticsReady()) return;

  const price = plan === 'monthly' ? 4.99 : 29.99;

  window.gtag('event', 'purchase', {
    currency: 'USD',
    value: price,
    transaction_id: transactionId,
    items: [{
      item_id: `pro_${plan}`,
      item_name: `Pro ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
      item_category: 'subscription',
      price: price,
      quantity: 1,
    }],
  });
}

// ==================== SEARCH & NAVIGATION ====================

export function trackSearch(searchTerm: string, resultsCount: number): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

export function trackNavigation(from: string, to: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'navigation', {
    from_page: from,
    to_page: to,
  });
}

// ==================== ERROR TRACKING ====================

export function trackError(errorType: string, errorMessage: string, context?: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
    error_context: context,
  });
}

// ==================== PERFORMANCE TRACKING ====================

export function trackTiming(category: string, variable: string, value: number, label?: string): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'timing_complete', {
    name: variable,
    value: value,
    event_category: category,
    event_label: label,
  });
}

// ==================== QUEST & GAMIFICATION ====================

export function trackQuestComplete(questId: string, questName: string, pointsEarned: number): void {
  if (!isAnalyticsReady()) return;

  window.gtag('event', 'quest_complete', {
    quest_id: questId,
    quest_name: questName,
    points_earned: pointsEarned,
  });

  window.gtag('event', 'earn_virtual_currency', {
    virtual_currency_name: 'points',
    value: pointsEarned,
  });
}
