import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as subscriptionService from '../subscriptionService';

let profileResult: unknown = null;
let profileError: unknown = null;

let maybeSingleMock: ReturnType<typeof vi.fn>;
let eqMock: ReturnType<typeof vi.fn>;
let selectMock: ReturnType<typeof vi.fn>;
let fromMock: ReturnType<typeof vi.fn>;

vi.mock('../supabase', () => {
  maybeSingleMock = vi.fn(async () => ({ data: profileResult, error: profileError }));
  eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
  selectMock = vi.fn(() => ({ eq: eqMock }));
  fromMock = vi.fn(() => ({ select: selectMock }));

  return {
    supabase: {
      from: (...args: unknown[]) => fromMock(...args),
    },
  };
});

describe('subscriptionService.getSubscriptionUsage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    profileResult = null;
    profileError = null;
    fromMock?.mockClear();
    selectMock?.mockClear();
    eqMock?.mockClear();
    maybeSingleMock?.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns free defaults when no subscription profile exists', async () => {
    const result = await subscriptionService.getSubscriptionUsage('user-123');

    expect(result).toEqual({
      tier: 'free',
      isGrandfathered: false,
      storiesGeneratedToday: 0,
      dailyLimit: 2,
      hasUnlimited: false,
      canGenerate: true,
      isPro: false,
    });
    expect(fromMock).toHaveBeenCalledWith('user_profiles');
  });

  it('grants unlimited generation for pro or grandfathered users', async () => {
    profileResult = {
      subscription_tier: 'pro',
      subscription_status: 'active',
      is_grandfathered: false,
      stories_generated_today: 3,
      total_stories_generated: 10,
      last_generation_date: '2024-01-01',
      stripe_customer_id: 'cus_123',
      total_points: 0,
      reading_points: 0,
      creating_points: 0,
    };

    const result = await subscriptionService.getSubscriptionUsage('user-123');

    expect(result).toEqual({
      tier: 'pro',
      isGrandfathered: false,
      storiesGeneratedToday: 3,
      dailyLimit: null,
      hasUnlimited: true,
      canGenerate: true,
      isPro: true,
    });
  });

  it('enforces free daily cap based on last_generation_date', async () => {
    profileResult = {
      subscription_tier: 'free',
      subscription_status: 'active',
      is_grandfathered: false,
      stories_generated_today: 2,
      total_stories_generated: 5,
      last_generation_date: '2024-01-01',
      stripe_customer_id: null,
      total_points: 0,
      reading_points: 0,
      creating_points: 0,
    };

    const result = await subscriptionService.getSubscriptionUsage('user-123');

    expect(result).toEqual({
      tier: 'free',
      isGrandfathered: false,
      storiesGeneratedToday: 2,
      dailyLimit: 2,
      hasUnlimited: false,
      canGenerate: false,
      isPro: false,
    });
  });

  it('resets daily count when last_generation_date is not today', async () => {
    profileResult = {
      subscription_tier: 'free',
      subscription_status: 'active',
      is_grandfathered: false,
      stories_generated_today: 2,
      total_stories_generated: 5,
      last_generation_date: '2023-12-31',
      stripe_customer_id: null,
      total_points: 0,
      reading_points: 0,
      creating_points: 0,
    };

    const result = await subscriptionService.getSubscriptionUsage('user-123');

    expect(result).toEqual({
      tier: 'free',
      isGrandfathered: false,
      storiesGeneratedToday: 0,
      dailyLimit: 2,
      hasUnlimited: false,
      canGenerate: true,
      isPro: false,
    });
  });
});
