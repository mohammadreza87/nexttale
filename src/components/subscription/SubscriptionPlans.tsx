import React, { useState } from 'react';
import { Check, Crown, Zap } from 'lucide-react';
import { stripeProducts, formatPrice } from '../../stripe-config';
import { createCheckoutSession } from '../../lib/stripe';

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSubscriptionChange?: () => void;
}

export function SubscriptionPlans({
  currentPlan,
  onSubscriptionChange: _onSubscriptionChange,
}: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const { url } = await createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription`,
        mode: 'subscription',
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (priceId: string) => currentPlan === priceId;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Unlock unlimited story generation with our Pro plans
        </p>
      </div>

      <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
        {stripeProducts.map((product) => {
          const isYearly = product.name.includes('Yearly');
          const isCurrentUserPlan = isCurrentPlan(product.priceId);

          return (
            <div
              key={product.priceId}
              className={`relative rounded-2xl bg-white p-8 shadow-xl ${
                isCurrentUserPlan
                  ? 'ring-2 ring-green-500'
                  : isYearly
                    ? 'scale-105 transform ring-2 ring-blue-500'
                    : ''
              }`}
            >
              {isCurrentUserPlan ? (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-medium text-white">
                    <Crown className="h-4 w-4" />
                    Current Plan
                  </span>
                </div>
              ) : isYearly ? (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white">
                    Most Popular
                  </span>
                </div>
              ) : null}

              <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                  {isYearly ? (
                    <Crown className="h-12 w-12 text-yellow-500" />
                  ) : (
                    <Zap className="h-12 w-12 text-blue-500" />
                  )}
                </div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900">{product.name}</h3>
                <p className="mb-4 text-gray-600">{product.description}</p>
                <div className="mb-2 text-4xl font-bold text-gray-900">
                  {formatPrice(product.price, product.currency)}
                  <span className="text-lg font-normal text-gray-600">
                    /{isYearly ? 'year' : 'month'}
                  </span>
                </div>
                {isYearly && <p className="font-medium text-green-600">Save €40 per year!</p>}
              </div>

              <ul className="mb-8 space-y-4">
                <li className="flex items-center">
                  <Check className="mr-3 h-5 w-5 text-green-500" />
                  <span>Unlimited story generation</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-3 h-5 w-5 text-green-500" />
                  <span>Edit mode for created stories</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-3 h-5 w-5 text-green-500" />
                  <span>AI-generated illustrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-3 h-5 w-5 text-green-500" />
                  <span>Text-to-speech narration</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-3 h-5 w-5 text-green-500" />
                  <span>Multiple language support</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-3 h-5 w-5 text-green-500" />
                  <span>Priority support</span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribe(product.priceId)}
                disabled={loading === product.priceId || isCurrentUserPlan}
                className={`w-full rounded-lg px-6 py-3 font-medium transition-colors ${
                  isCurrentUserPlan
                    ? 'cursor-not-allowed bg-gray-100 text-gray-500'
                    : isYearly
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {loading === product.priceId
                  ? 'Processing...'
                  : isCurrentUserPlan
                    ? 'Current Plan'
                    : `Subscribe to ${product.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          All plans include a 30-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
