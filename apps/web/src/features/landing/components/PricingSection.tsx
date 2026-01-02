import { Check, Crown, Shield } from 'lucide-react';

interface PricingSectionProps {
  onGetStarted: () => void;
}

const FREE_FEATURES = [
  '2 story generations per day',
  'Unlimited reading',
  'AI illustrations',
  'Basic narration',
];

const PRO_FEATURES = [
  'Unlimited story generations',
  'Premium voice narration',
  'Priority processing',
  'Edit & customize stories',
  'Everything in Free',
];

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  return (
    <section className="bg-gray-950 py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
            PRICING
          </span>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Simple Pricing</h2>
          <p className="text-xl text-gray-400">Start free. Upgrade for unlimited storytelling.</p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          {/* Free Tier */}
          <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8 transition-colors hover:border-gray-700">
            <h3 className="mb-2 text-2xl font-bold text-white">Free</h3>
            <p className="mb-6 text-gray-500">Perfect for exploring</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$0</span>
              <span className="ml-2 text-gray-500">/forever</span>
            </div>
            <ul className="mb-8 space-y-4">
              {FREE_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-400">
                  <Check className="h-5 w-5 flex-shrink-0 text-purple-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={onGetStarted}
              className="w-full rounded-2xl bg-gray-800 py-4 font-bold text-white transition-colors hover:bg-gray-700"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Tier */}
          <div className="relative transform overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900 to-pink-900 p-8 transition-transform hover:scale-[1.02]">
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-yellow-900">
              <Crown className="h-3 w-3" />
              POPULAR
            </div>
            <h3 className="mb-2 text-2xl font-bold text-white">Pro</h3>
            <p className="mb-6 text-purple-200">Unlimited storytelling</p>
            <div className="mb-2">
              <span className="text-5xl font-bold text-white">$15</span>
              <span className="ml-2 text-purple-200">/month</span>
            </div>
            <p className="mb-6 text-sm text-purple-300">or $150/year (save $30)</p>
            <ul className="mb-8 space-y-4">
              {PRO_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-white">
                  <Check className="h-5 w-5 flex-shrink-0 text-yellow-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={onGetStarted}
              className="w-full rounded-2xl bg-white py-4 font-bold text-purple-700 transition-colors hover:bg-gray-100"
            >
              Start Pro Trial
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="flex items-center justify-center gap-2 text-gray-500">
            <Shield className="h-5 w-5 text-green-500" />
            30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
