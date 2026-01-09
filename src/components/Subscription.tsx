import { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, Settings, Loader } from 'lucide-react';
import {
  getUserSubscription,
  createCheckoutSession,
  createCustomerPortalSession,
  STRIPE_PRICES,
} from '../lib/subscriptionService';
import type { UserProfile } from '../lib/types';
import { useAuth } from '../lib/authContext';
import { trackSubscriptionView, trackSubscriptionCheckoutStart } from '../lib/analytics';
import { usePostHog } from '../hooks/usePostHog';

interface SubscriptionProps {
  userId: string;
  onBack: () => void;
}

export function Subscription({ userId }: SubscriptionProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const posthog = usePostHog();

  useEffect(() => {
    loadSubscription();
    // Track subscription page view
    trackSubscriptionView('monthly');
    posthog.subscription('viewed', 'monthly');
  }, [userId]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const data = await getUserSubscription(user.id);
      if (data) {
        setSubscription(data as any);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    if (!priceId || priceId.includes('your_') || priceId.includes('_here')) {
      alert(
        'Stripe is not configured. Please add your Stripe price IDs to the .env file.\n\nRequired variables:\n- VITE_STRIPE_PRICE_BASIC_MONTHLY\n- VITE_STRIPE_PRICE_BASIC_ANNUAL\n- VITE_STRIPE_PRICE_PRO_MONTHLY\n- VITE_STRIPE_PRICE_PRO_ANNUAL\n- VITE_STRIPE_PRICE_MAX_MONTHLY\n- VITE_STRIPE_PRICE_MAX_ANNUAL\n\nAlso set STRIPE_SECRET_KEY in Supabase Edge Functions.'
      );
      return;
    }

    setCheckoutLoading(true);
    // Track checkout start
    const plan = priceId === STRIPE_PRICES.PRO_MONTHLY ? 'monthly' : 'annual';
    trackSubscriptionCheckoutStart(plan);
    posthog.subscription('checkout_started', plan);

    try {
      const url = await createCheckoutSession(priceId);
      if (url) {
        window.location.href = url;
      } else {
        alert(
          'Failed to start checkout. Please ensure:\n1. Stripe API keys are configured\n2. Price IDs are valid\n3. Stripe webhook is set up'
        );
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert(
        'Checkout failed. Please check:\n1. Stripe configuration in .env\n2. STRIPE_SECRET_KEY in Supabase\n3. Price IDs are valid'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    const url = await createCustomerPortalSession();
    if (url) {
      window.location.href = url;
    } else {
      alert('Unable to open subscription management. Please try again.');
    }
  };

  const hasPro = subscription?.subscription_tier === 'pro' || subscription?.is_grandfathered;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 pb-20">
        <div className="flex gap-2">
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 pb-6 pt-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {hasPro ? 'Your Subscription' : 'Choose Your Plan'}
          </h1>
          <p className="text-sm text-gray-600">
            {hasPro
              ? 'Manage your premium membership'
              : 'Unlock unlimited story creation and premium features'}
          </p>
        </div>

        {hasPro ? (
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Pro Membership</h2>
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-sm font-medium text-white">
                  <Crown className="h-4 w-4" />
                  <span>Active {subscription?.is_grandfathered && '(Lifetime)'}</span>
                </div>
              </div>
              <Sparkles className="h-10 w-10 text-purple-500" />
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-600">Status</span>
                <span className="text-sm font-semibold capitalize text-green-600">
                  {subscription?.subscription_status}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-600">Stories Generated Today</span>
                <span className="text-sm font-semibold text-gray-900">Unlimited</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-600">Total Stories Created</span>
                <span className="text-sm font-semibold text-gray-900">
                  {subscription?.total_stories_generated || 0}
                </span>
              </div>
              {subscription?.subscription_period_end && !subscription?.is_grandfathered && (
                <div className="flex items-center justify-between border-b border-gray-100 py-3">
                  <span className="text-sm text-gray-600">Renewal Date</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(subscription.subscription_period_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {!subscription?.is_grandfathered && subscription?.stripe_customer_id && (
              <button
                onClick={handleManageSubscription}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-900 transition-all hover:bg-gray-200"
              >
                <Settings className="h-5 w-5" />
                Manage Subscription
              </button>
            )}

            {subscription?.is_grandfathered && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-3">
                <p className="text-center text-xs text-gray-700">
                  🎉 You have lifetime Pro access as an early supporter. Thank you!
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Plan Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Free Plan */}
              <div className="flex flex-col rounded-3xl bg-white p-5 shadow-xl">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Free</h3>
                  <p className="text-sm text-gray-500">Basic features</p>
                </div>
                <div className="mb-4 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">2 stories per day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">Read unlimited stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">Basic art styles</span>
                  </div>
                </div>
                <div className="mt-auto rounded-xl border-2 border-gray-200 py-3 text-center text-sm font-semibold text-gray-500">
                  Current Plan
                </div>
              </div>

              {/* Pro Monthly */}
              <div className="flex flex-col rounded-3xl bg-white p-5 shadow-xl">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Pro Monthly</h3>
                  <p className="text-sm text-gray-500">Full access • $20/month</p>
                </div>
                <div className="mb-4 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">Unlimited stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">All art styles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">AI Narrator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">Edit mode & Add your option</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUpgrade(STRIPE_PRICES.PRO_MONTHLY)}
                  disabled={checkoutLoading}
                  className="mt-auto w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <Loader className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    'Try For $20'
                  )}
                </button>
              </div>

              {/* Pro Annual */}
              <div className="flex flex-col rounded-3xl bg-white p-5 shadow-xl">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Pro Annual</h3>
                  <p className="text-sm text-gray-500">Best value • $16.67/month</p>
                </div>
                <div className="mb-4 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">Unlimited stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">All art styles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">AI Narrator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="text-sm text-gray-700">Edit mode & Add your option</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUpgrade(STRIPE_PRICES.PRO_ANNUAL)}
                  disabled={checkoutLoading}
                  className="mt-auto w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <Loader className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    'Try For $200'
                  )}
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              Cancel anytime. Secure payment via Stripe.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
