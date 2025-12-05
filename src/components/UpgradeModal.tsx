import { X, Check, Loader } from 'lucide-react';
import { useState } from 'react';
import { createCheckoutSession, STRIPE_PRICES } from '../lib/subscriptionService';
import { trackSubscriptionCheckoutStart } from '../lib/analytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async (priceId: string) => {
    if (!priceId || priceId.includes('your_') || priceId.includes('_here')) {
      alert('Stripe is not configured. Please add your Stripe API keys and price IDs to the .env file.\n\nRequired variables:\n- VITE_STRIPE_PUBLISHABLE_KEY\n- VITE_STRIPE_PRICE_MONTHLY\n- VITE_STRIPE_PRICE_ANNUAL\n\nAlso set STRIPE_SECRET_KEY in Supabase Edge Functions.');
      return;
    }

    setCheckoutLoading(true);
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="sticky top-0 bg-gray-900 px-6 py-4 flex items-center justify-between border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
            <p className="text-sm text-gray-400">Unlock unlimited story creation and premium features</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free Plan */}
            <div className="bg-gray-800 rounded-3xl shadow-xl p-5 flex flex-col border border-gray-700">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Free</h3>
                <p className="text-sm text-gray-400">Basic features</p>
              </div>
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">2 stories per day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Read unlimited stories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Basic art styles</span>
                </div>
              </div>
              <div className="py-3 border-2 border-gray-600 text-gray-400 font-semibold rounded-xl text-center text-sm mt-auto">
                Current Plan
              </div>
            </div>

            {/* Pro Monthly */}
            <div className="bg-gray-800 rounded-3xl shadow-xl p-5 flex flex-col border border-gray-700">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Pro Monthly</h3>
                <p className="text-sm text-gray-400">Full access • $20/month</p>
              </div>
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Unlimited stories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">All art styles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">AI Narrator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Edit mode & Add your option</span>
                </div>
              </div>
              <button
                onClick={() => handleUpgrade(STRIPE_PRICES.PRO_MONTHLY)}
                disabled={checkoutLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-auto shadow-lg"
              >
                {checkoutLoading ? (
                  <Loader className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Try For $20'
                )}
              </button>
            </div>

            {/* Pro Annual */}
            <div className="bg-gray-800 rounded-3xl shadow-xl p-5 flex flex-col border border-purple-500/50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white">
                BEST VALUE
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Pro Annual</h3>
                <p className="text-sm text-gray-400">Best value • $16.67/month</p>
              </div>
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Unlimited stories</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">All art styles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">AI Narrator</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Edit mode & Add your option</span>
                </div>
              </div>
              <button
                onClick={() => handleUpgrade(STRIPE_PRICES.PRO_ANNUAL)}
                disabled={checkoutLoading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-auto shadow-lg"
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
        </div>
      </div>
    </div>
  );
}
