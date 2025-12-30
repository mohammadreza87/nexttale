import { X, Check, Loader, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { createCheckoutSession, STRIPE_PRICES } from '../lib/subscriptionService';
import { trackSubscriptionCheckoutStart } from '../lib/analytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BillingCycle = 'monthly' | 'annual';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceId: string;
  annualPriceId: string;
  features: PlanFeature[];
  popular?: boolean;
  color: 'blue' | 'purple' | 'amber';
}

const plans: Plan[] = [
  {
    name: 'Basic',
    description: 'Great for getting started',
    monthlyPrice: 5,
    annualPrice: 50,
    monthlyPriceId: STRIPE_PRICES.BASIC_MONTHLY,
    annualPriceId: STRIPE_PRICES.BASIC_ANNUAL,
    color: 'blue',
    features: [
      { text: '5 stories per day', included: true },
      { text: 'Basic art styles', included: true },
      { text: 'Read unlimited stories', included: true },
      { text: 'AI Narrator', included: false },
      { text: 'Voice Input for choices', included: false },
      { text: 'Edit mode & Custom choices', included: false },
      { text: 'Video clips', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'Most popular choice',
    monthlyPrice: 15,
    annualPrice: 150,
    monthlyPriceId: STRIPE_PRICES.PRO_MONTHLY,
    annualPriceId: STRIPE_PRICES.PRO_ANNUAL,
    color: 'purple',
    popular: true,
    features: [
      { text: 'Unlimited stories', included: true },
      { text: 'All art styles', included: true },
      { text: 'Read unlimited stories', included: true },
      { text: 'AI Narrator', included: true },
      { text: 'Voice Input for choices', included: true },
      { text: 'Edit mode & Custom choices', included: true },
      { text: 'Video clips', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Max',
    description: 'Ultimate experience',
    monthlyPrice: 30,
    annualPrice: 300,
    monthlyPriceId: STRIPE_PRICES.MAX_MONTHLY,
    annualPriceId: STRIPE_PRICES.MAX_ANNUAL,
    color: 'amber',
    features: [
      { text: 'Unlimited stories', included: true },
      { text: 'All art styles', included: true },
      { text: 'Read unlimited stories', included: true },
      { text: 'AI Narrator', included: true },
      { text: 'Voice Input for choices', included: true },
      { text: 'Edit mode & Custom choices', included: true },
      { text: 'Video clips', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

const colorClasses = {
  blue: {
    check: 'text-blue-400',
    button: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    border: 'border-blue-500/50',
    badge: 'bg-gradient-to-r from-blue-600 to-cyan-600',
  },
  purple: {
    check: 'text-purple-400',
    button: 'bg-gradient-to-r from-purple-600 to-pink-600',
    border: 'border-purple-500/50',
    badge: 'bg-gradient-to-r from-purple-600 to-pink-600',
  },
  amber: {
    check: 'text-amber-400',
    button: 'bg-gradient-to-r from-amber-500 to-orange-600',
    border: 'border-amber-500/50',
    badge: 'bg-gradient-to-r from-amber-500 to-orange-600',
  },
};

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  if (!isOpen) return null;

  const handleUpgrade = async (plan: Plan) => {
    const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.annualPriceId;

    if (!priceId || priceId.includes('your_') || priceId.includes('_here')) {
      alert(
        `Stripe is not configured for ${plan.name} plan. Please add your Stripe price IDs to the .env file.`
      );
      return;
    }

    setCheckoutLoading(plan.name);
    trackSubscriptionCheckoutStart(billingCycle);

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
      setCheckoutLoading(null);
    }
  };

  const getPrice = (plan: Plan) => {
    if (billingCycle === 'monthly') {
      return plan.monthlyPrice;
    }
    return Math.round((plan.annualPrice / 12) * 100) / 100;
  };

  const getSavings = (plan: Plan) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const annualCost = plan.annualPrice;
    return Math.round(((monthlyCost - annualCost) / monthlyCost) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-gray-800 bg-gray-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
            <p className="text-sm text-gray-400">
              Unlock unlimited story creation and premium features
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Billing Cycle Toggle */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-1 rounded-full bg-gray-800 p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Annual
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                  Save up to 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const colors = colorClasses[plan.color];
              const price = getPrice(plan);
              const savings = getSavings(plan);

              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-3xl border bg-gray-800 p-5 shadow-xl ${
                    plan.popular ? colors.border : 'border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <div
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 ${colors.badge} flex items-center gap-1 rounded-full text-xs font-bold text-white`}
                    >
                      <Sparkles className="h-3 w-3" />
                      MOST POPULAR
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">${price.toFixed(2)}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="mt-1 text-sm text-green-400">
                        Save {savings}% • Billed ${plan.annualPrice}/year
                      </p>
                    )}
                  </div>

                  <div className="mb-6 flex-1 space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check
                          className={`h-4 w-4 flex-shrink-0 ${
                            feature.included ? colors.check : 'text-gray-600'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-gray-300' : 'text-gray-500 line-through'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={checkoutLoading !== null}
                    className={`w-full py-3 ${colors.button} mt-auto rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {checkoutLoading === plan.name ? (
                      <Loader className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Cancel anytime. Secure payment via Stripe. All prices in USD.
          </p>
        </div>
      </div>
    </div>
  );
}
