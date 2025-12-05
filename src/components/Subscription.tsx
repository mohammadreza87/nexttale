import { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, Settings, Loader, X, User } from 'lucide-react';
import { getUserSubscription, createCheckoutSession, createCustomerPortalSession, STRIPE_PRICES } from '../lib/subscriptionService';
import type { UserProfile } from '../lib/types';
import { useAuth } from '../lib/authContext';
import { trackSubscriptionView, trackSubscriptionCheckoutStart } from '../lib/analytics';

interface SubscriptionProps {
  userId: string;
  onBack: () => void;
}

export function Subscription({ userId }: SubscriptionProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
    // Track subscription page view
    trackSubscriptionView('monthly');
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
      alert('Stripe is not configured. Please add your Stripe API keys and price IDs to the .env file.\n\nRequired variables:\n- VITE_STRIPE_PUBLISHABLE_KEY\n- VITE_STRIPE_PRICE_MONTHLY\n- VITE_STRIPE_PRICE_ANNUAL\n\nAlso set STRIPE_SECRET_KEY in Supabase Edge Functions.');
      return;
    }

    setCheckoutLoading(true);
    // Track checkout start
    const plan = priceId === STRIPE_PRICES.PRO_MONTHLY ? 'monthly' : 'annual';
    trackSubscriptionCheckoutStart(plan);

    try {
      const url = await createCheckoutSession(priceId);
      if (url) {
        window.location.href = url;
      } else {
        alert('Failed to start checkout. Please ensure:\n1. Stripe API keys are configured\n2. Price IDs are valid\n3. Stripe webhook is set up');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Checkout failed. Please check:\n1. Stripe configuration in .env\n2. STRIPE_SECRET_KEY in Supabase\n3. Price IDs are valid');
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
      <div className="min-h-screen bg-gray-50 pb-20 flex flex-col items-center justify-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {hasPro ? 'Your Subscription' : 'Choose Your Plan'}
          </h1>
          <p className="text-sm text-gray-600">
            {hasPro
              ? 'Manage your premium membership'
              : 'Unlock unlimited story creation and premium features'}
          </p>
        </div>

        {hasPro ? (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Membership</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium">
                  <Crown className="w-4 h-4" />
                  <span>Active {subscription?.is_grandfathered && '(Lifetime)'}</span>
                </div>
              </div>
              <Sparkles className="w-10 h-10 text-purple-500" />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Status</span>
                <span className="font-semibold text-green-600 capitalize text-sm">
                  {subscription?.subscription_status}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Stories Generated Today</span>
                <span className="font-semibold text-gray-900 text-sm">Unlimited</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Total Stories Created</span>
                <span className="font-semibold text-gray-900 text-sm">{subscription?.total_stories_generated || 0}</span>
              </div>
              {subscription?.subscription_period_end && !subscription?.is_grandfathered && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">Renewal Date</span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {new Date(subscription.subscription_period_end).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {!subscription?.is_grandfathered && subscription?.stripe_customer_id && (
              <button
                onClick={handleManageSubscription}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Manage Subscription
              </button>
            )}

            {subscription?.is_grandfathered && (
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <p className="text-xs text-gray-700 text-center">
                  🎉 You have lifetime Pro access as an early supporter. Thank you!
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Plan */}
              <div className="bg-white rounded-3xl shadow-xl p-5 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Free</h3>
                  <p className="text-sm text-gray-500">Basic features</p>
                </div>
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">2 stories per day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Read unlimited stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Basic art styles</span>
                  </div>
                </div>
                <div className="py-3 border-2 border-gray-200 text-gray-500 font-semibold rounded-xl text-center text-sm mt-auto">
                  Current Plan
                </div>
              </div>

              {/* Pro Monthly */}
              <div className="bg-white rounded-3xl shadow-xl p-5 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Pro Monthly</h3>
                  <p className="text-sm text-gray-500">Full access • $20/month</p>
                </div>
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Unlimited stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">All art styles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">AI Narrator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Edit mode & Add your option</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUpgrade(STRIPE_PRICES.PRO_MONTHLY)}
                  disabled={checkoutLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-auto shadow-lg"
                >
                  {checkoutLoading ? (
                    <Loader className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Try For $20'
                  )}
                </button>
              </div>

              {/* Pro Annual */}
              <div className="bg-white rounded-3xl shadow-xl p-5 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Pro Annual</h3>
                  <p className="text-sm text-gray-500">Best value • $16.67/month</p>
                </div>
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Unlimited stories</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">All art styles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">AI Narrator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Edit mode & Add your option</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUpgrade(STRIPE_PRICES.PRO_ANNUAL)}
                  disabled={checkoutLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-auto shadow-lg"
                >
                  {checkoutLoading ? (
                    <Loader className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Try For $200'
                  )}
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              Cancel anytime. Secure payment via Stripe.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
