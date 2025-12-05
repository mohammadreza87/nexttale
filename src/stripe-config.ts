export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'subscription' | 'payment';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'YOUR_LIVE_PRODUCT_ID_MONTHLY',
    priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_YOUR_LIVE_MONTHLY_PRICE_ID_HERE',
    name: 'Pro Monthly',
    description: 'Unlimited story generation with premium features',
    price: 20.00,
    currency: 'eur',
    mode: 'subscription'
  },
  {
    id: 'YOUR_LIVE_PRODUCT_ID_ANNUAL',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL || 'price_YOUR_LIVE_ANNUAL_PRICE_ID_HERE',
    name: 'Pro Yearly',
    description: 'Unlimited story generation with premium features - Save 17%',
    price: 200.00,
    currency: 'eur',
    mode: 'subscription'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const formatPrice = (price: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(price);
};