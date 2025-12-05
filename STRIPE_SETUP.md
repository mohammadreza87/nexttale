# Stripe Setup Guide

Configure Stripe for Mina's subscription system.

## Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 2 stories/day |
| Pro Monthly | $20/month | Unlimited stories |
| Pro Annual | $200/year | Unlimited stories (save $40) |

## Step 1: Create Stripe Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) > Products > Add Product

**Monthly Product:**
- Name: Pro Membership (Monthly)
- Price: $20.00 USD, Monthly recurring
- Copy the Price ID (`price_...`)

**Annual Product:**
- Name: Pro Membership (Annual)
- Price: $200.00 USD, Yearly recurring
- Copy the Price ID (`price_...`)

## Step 2: Get API Keys

Go to Developers > API Keys:
- Copy **Publishable key** (`pk_...`)
- Copy **Secret key** (`sk_...`)

## Step 3: Configure Supabase Secrets

In Supabase Dashboard > Edge Functions > Secrets, add:

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Step 5)
```

## Step 4: Configure Frontend

Add to `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
VITE_STRIPE_PRICE_MONTHLY=price_...
VITE_STRIPE_PRICE_ANNUAL=price_...
```

## Step 5: Configure Webhook

1. Developers > Webhooks > Add Endpoint
2. URL: `https://[PROJECT].supabase.co/functions/v1/stripe-webhook`
3. Events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy Signing Secret to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

## Step 6: Enable Customer Portal

Settings > Customer Portal > Activate

Enable:
- Update payment method
- Cancel subscriptions
- Update billing info

## Testing

Use test card: `4242 4242 4242 4242`
- Any future expiration
- Any 3-digit CVC

## Implemented Features

### Edge Functions
- `create-checkout` - Creates Stripe checkout session
- `customer-portal` - Opens subscription management
- `stripe-webhook` - Handles payment events

### Frontend
- Upgrade modal with pricing
- Usage badge showing daily limits
- Subscription management in profile

### Database
- `subscription_tier` (free/pro)
- `stripe_customer_id`
- `stripe_subscription_id`
- `stories_generated_today`
- `is_grandfathered` (legacy Pro users)

## Troubleshooting

**Webhook not working:**
- Verify endpoint URL
- Check webhook secret in Supabase
- View logs in Stripe Dashboard

**Checkout not loading:**
- Verify publishable key
- Check browser console
- Confirm price IDs are correct

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
