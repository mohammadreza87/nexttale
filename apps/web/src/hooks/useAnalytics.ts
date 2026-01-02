/**
 * React hook for Google Analytics integration
 *
 * Provides easy-to-use analytics functions within React components
 * with automatic user tracking and view management.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/authContext';
import {
  initializeAnalytics,
  trackPageView,
  setUserProperties,
  setUserSubscriptionTier,
  trackStoryView,
  trackStoryStart,
  trackChapterRead,
  trackStoryComplete,
  trackChoiceSelected,
  trackStoryCreationStart,
  trackStoryCreated,
  trackSignUp,
  trackLogin,
  trackShare,
  trackReaction,
  trackComment,
  trackFollow,
  trackSubscriptionView,
  trackSubscriptionCheckoutStart,
  trackSubscriptionPurchase,
  trackSearch,
  trackNavigation,
  trackError,
  trackTiming,
  trackQuestComplete,
} from '../lib/analytics';

// Initialize analytics once when the app loads
let analyticsInitialized = false;

export function useAnalytics() {
  const { user } = useAuth();
  const previousView = useRef<string>('');

  // Initialize analytics on first mount
  useEffect(() => {
    if (!analyticsInitialized) {
      initializeAnalytics();
      analyticsInitialized = true;
    }
  }, []);

  // Update user properties when user changes
  useEffect(() => {
    if (user) {
      setUserProperties(user.id, {
        user_type: 'authenticated',
      });
    } else {
      setUserProperties(null, {
        user_type: 'anonymous',
      });
    }
  }, [user?.id]);

  // Page view tracking with navigation context
  const pageView = useCallback((pagePath: string, pageTitle?: string) => {
    if (previousView.current && previousView.current !== pagePath) {
      trackNavigation(previousView.current, pagePath);
    }
    trackPageView(pagePath, pageTitle);
    previousView.current = pagePath;
  }, []);

  // Story events
  const storyView = useCallback((storyId: string, storyTitle: string, creatorId?: string) => {
    trackStoryView(storyId, storyTitle, creatorId);
  }, []);

  const storyStart = useCallback((storyId: string, storyTitle: string) => {
    trackStoryStart(storyId, storyTitle);
  }, []);

  const chapterRead = useCallback((storyId: string, chapterIndex: number, isEnding: boolean) => {
    trackChapterRead(storyId, chapterIndex, isEnding);
  }, []);

  const storyComplete = useCallback((storyId: string, storyTitle: string, chaptersRead: number) => {
    trackStoryComplete(storyId, storyTitle, chaptersRead);
  }, []);

  const choiceSelected = useCallback((storyId: string, choiceId: string, choiceText: string, isCustom = false) => {
    trackChoiceSelected(storyId, choiceId, choiceText, isCustom);
  }, []);

  // Creation events
  const creationStart = useCallback((artStyle: string, ageRange: string) => {
    trackStoryCreationStart(artStyle, ageRange);
  }, []);

  const storyCreated = useCallback((storyId: string, storyTitle: string, artStyle: string, isPublic: boolean) => {
    trackStoryCreated(storyId, storyTitle, artStyle, isPublic);
  }, []);

  // Auth events
  const signUp = useCallback((method: 'email' | 'google' | 'apple') => {
    trackSignUp(method);
  }, []);

  const login = useCallback((method: 'email' | 'google' | 'apple') => {
    trackLogin(method);
  }, []);

  // Engagement events
  const share = useCallback((storyId: string, storyTitle: string, method: 'copy' | 'native') => {
    trackShare(storyId, storyTitle, method);
  }, []);

  const reaction = useCallback((storyId: string, reactionType: 'like' | 'dislike') => {
    trackReaction(storyId, reactionType);
  }, []);

  const comment = useCallback((storyId: string) => {
    trackComment(storyId);
  }, []);

  const follow = useCallback((followedUserId: string) => {
    trackFollow(followedUserId);
  }, []);

  // Subscription events
  const subscriptionView = useCallback((plan: 'monthly' | 'annual') => {
    trackSubscriptionView(plan);
  }, []);

  const checkoutStart = useCallback((plan: 'monthly' | 'annual') => {
    trackSubscriptionCheckoutStart(plan);
  }, []);

  const purchase = useCallback((plan: 'monthly' | 'annual', transactionId: string) => {
    trackSubscriptionPurchase(plan, transactionId);
    setUserSubscriptionTier('pro');
  }, []);

  // Utility events
  const search = useCallback((searchTerm: string, resultsCount: number) => {
    trackSearch(searchTerm, resultsCount);
  }, []);

  const error = useCallback((errorType: string, errorMessage: string, context?: string) => {
    trackError(errorType, errorMessage, context);
  }, []);

  const timing = useCallback((category: string, variable: string, value: number, label?: string) => {
    trackTiming(category, variable, value, label);
  }, []);

  const questComplete = useCallback((questId: string, questName: string, pointsEarned: number) => {
    trackQuestComplete(questId, questName, pointsEarned);
  }, []);

  return {
    // Page tracking
    pageView,

    // Story events
    storyView,
    storyStart,
    chapterRead,
    storyComplete,
    choiceSelected,

    // Creation events
    creationStart,
    storyCreated,

    // Auth events
    signUp,
    login,

    // Engagement events
    share,
    reaction,
    comment,
    follow,

    // Subscription events
    subscriptionView,
    checkoutStart,
    purchase,

    // Utility events
    search,
    error,
    timing,
    questComplete,
  };
}

// Simple hook for page view tracking only
export function usePageView(pagePath: string, pageTitle?: string) {
  const { pageView } = useAnalytics();

  useEffect(() => {
    pageView(pagePath, pageTitle);
  }, [pagePath, pageTitle, pageView]);
}
