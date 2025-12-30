import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SubscriptionPlans } from '../components/subscription/SubscriptionPlans';
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus';
import { ArrowLeft } from 'lucide-react';

interface SubscriptionData {
  subscription_status: string | null;
  price_id: string | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      await fetchSubscription();
    };

    checkAuth();
  }, [navigate]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionChange = () => {
    fetchSubscription();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Stories
          </button>
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Current Plan</h2>
            <SubscriptionStatus subscription={subscription} loading={loading} />
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Available Plans</h2>
            <SubscriptionPlans
              currentPlan={subscription?.price_id || undefined}
              onSubscriptionChange={handleSubscriptionChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
