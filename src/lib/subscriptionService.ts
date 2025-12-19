import { supabase } from './supabase';
import type { SubscriptionPlan } from './types';

export interface UserSubscription {
  subscription_tier: 'free' | 'pro';
  subscription_plan: SubscriptionPlan | null;
  subscription_status: string;
  is_grandfathered: boolean;
  stories_generated_today: number;
  total_stories_generated: number;
  last_generation_date: string | null;
  stripe_customer_id: string | null;
  total_points: number;
  reading_points: number;
  creating_points: number;
}

export interface SubscriptionUsage {
  tier: 'free' | 'pro';
  plan: SubscriptionPlan | null;
  isGrandfathered: boolean;
  storiesGeneratedToday: number;
  dailyLimit: number | null;
  hasUnlimited: boolean;
  canGenerate: boolean;
  isPro: boolean;
  // Feature flags based on plan
  hasAiNarrator: boolean;
  hasVoiceInput: boolean;
  hasEditMode: boolean;
  hasVideoClips: boolean;
  hasPrioritySupport: boolean;
}

export const STRIPE_PRICES = {
  // Legacy (kept for backward compatibility)
  PRO_MONTHLY:
    import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY ||
    import.meta.env.VITE_STRIPE_PRICE_MONTHLY ||
    '',
  PRO_ANNUAL:
    import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL || import.meta.env.VITE_STRIPE_PRICE_ANNUAL || '',
  // New 3-tier pricing
  BASIC_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_BASIC_MONTHLY || '',
  BASIC_ANNUAL: import.meta.env.VITE_STRIPE_PRICE_BASIC_ANNUAL || '',
  MAX_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_MAX_MONTHLY || '',
  MAX_ANNUAL: import.meta.env.VITE_STRIPE_PRICE_MAX_ANNUAL || '',
};

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  // Guard against empty or invalid userId
  if (!userId || userId.trim() === '') {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      'subscription_tier, subscription_plan, subscription_status, is_grandfathered, stories_generated_today, total_stories_generated, last_generation_date, stripe_customer_id, total_points, reading_points, creating_points'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data as UserSubscription;
}

// Helper to determine feature access based on plan
function getFeatureAccess(plan: SubscriptionPlan | null, isGrandfathered: boolean) {
  // Grandfathered users get max features
  if (isGrandfathered) {
    return {
      hasAiNarrator: true,
      hasVoiceInput: true,
      hasEditMode: true,
      hasVideoClips: true,
      hasPrioritySupport: true,
    };
  }

  // Feature matrix by plan
  switch (plan) {
    case 'max':
      return {
        hasAiNarrator: true,
        hasVoiceInput: true,
        hasEditMode: true,
        hasVideoClips: true,
        hasPrioritySupport: true,
      };
    case 'pro':
      return {
        hasAiNarrator: true,
        hasVoiceInput: true,
        hasEditMode: true,
        hasVideoClips: false,
        hasPrioritySupport: false,
      };
    case 'basic':
      return {
        hasAiNarrator: false,
        hasVoiceInput: false,
        hasEditMode: false,
        hasVideoClips: false,
        hasPrioritySupport: false,
      };
    default:
      // Free tier
      return {
        hasAiNarrator: false,
        hasVoiceInput: false,
        hasEditMode: false,
        hasVideoClips: false,
        hasPrioritySupport: false,
      };
  }
}

// Get daily story limit based on plan
function getDailyLimit(plan: SubscriptionPlan | null, isGrandfathered: boolean): number | null {
  if (isGrandfathered) return null; // Unlimited

  switch (plan) {
    case 'max':
    case 'pro':
      return null; // Unlimited
    case 'basic':
      return 5; // 5 stories per day
    default:
      return 2; // Free tier: 2 stories per day
  }
}

export async function getSubscriptionUsage(userId: string): Promise<SubscriptionUsage> {
  // TEMPORARY: Enable all Pro features for everyone
  const ENABLE_ALL_FEATURES = false;

  if (ENABLE_ALL_FEATURES) {
    return {
      tier: 'pro',
      plan: 'max',
      isGrandfathered: true,
      storiesGeneratedToday: 0,
      dailyLimit: null,
      hasUnlimited: true,
      canGenerate: true,
      isPro: true,
      hasAiNarrator: true,
      hasVoiceInput: true,
      hasEditMode: true,
      hasVideoClips: true,
      hasPrioritySupport: true,
    };
  }

  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    const freeFeatures = getFeatureAccess(null, false);
    return {
      tier: 'free',
      plan: null,
      isGrandfathered: false,
      storiesGeneratedToday: 0,
      dailyLimit: 2,
      hasUnlimited: false,
      canGenerate: true,
      isPro: false,
      ...freeFeatures,
    };
  }

  const plan = subscription.subscription_plan;
  const isGrandfathered = subscription.is_grandfathered;
  const hasPro = subscription.subscription_tier === 'pro' || isGrandfathered;
  const today = new Date().toISOString().split('T')[0];
  const isToday = subscription.last_generation_date === today;
  const todayCount = isToday ? subscription.stories_generated_today : 0;
  const dailyLimit = getDailyLimit(plan, isGrandfathered);
  const features = getFeatureAccess(plan, isGrandfathered);

  return {
    tier: subscription.subscription_tier,
    plan,
    isGrandfathered,
    storiesGeneratedToday: todayCount,
    dailyLimit,
    hasUnlimited: dailyLimit === null,
    canGenerate: dailyLimit === null || todayCount < dailyLimit,
    isPro: hasPro,
    ...features,
  };
}

export async function createCheckoutSession(priceId: string): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}?checkout=success`,
          cancelUrl: `${window.location.origin}?checkout=canceled`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
}

export async function createCustomerPortalSession(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-portal`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.origin,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    return null;
  }
}
