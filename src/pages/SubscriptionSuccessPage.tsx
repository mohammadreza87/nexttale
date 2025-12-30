import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function SubscriptionSuccessPage() {
  const [_searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      await fetchSubscription();
    };

    checkAuth();
  }, [navigate]);

  const fetchSubscription = async () => {
    try {
      // Wait a moment for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mb-6">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Welcome to Pro!</h1>
          <p className="text-gray-600">Your subscription has been activated successfully.</p>
        </div>

        {loading ? (
          <div className="mb-6">
            <div className="animate-pulse">
              <div className="mx-auto mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="mx-auto h-4 w-1/2 rounded bg-gray-200"></div>
            </div>
          </div>
        ) : subscription && subscription.subscription_status === 'active' ? (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-800">
              🎉 You now have unlimited story generation!
            </p>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-yellow-800">
              Your subscription is being processed. This may take a few minutes.
            </p>
          </div>
        )}

        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-center text-sm text-gray-600">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Unlimited story generation
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            AI-generated illustrations
          </div>
          <div className="flex items-center justify-center text-sm text-gray-600">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Text-to-speech narration
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Start Creating Stories
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>

          <button
            onClick={() => navigate('/subscription')}
            className="w-full rounded-lg px-4 py-2 font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            View Subscription Details
          </button>
        </div>
      </div>
    </div>
  );
}
