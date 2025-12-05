import { useEffect, useState } from 'react';
import { getSubscriptionUsage, SubscriptionUsage } from '../lib/subscriptionService';
import { useAuth } from '../lib/authContext';

interface UsageBadgeProps {
  onUpgradeClick?: () => void;
}

export default function UsageBadge({ onUpgradeClick }: UsageBadgeProps) {
  const { user } = useAuth();
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUsage();
    }
  }, [user]);

  const loadUsage = async () => {
    if (!user) return;

    try {
      const data = await getSubscriptionUsage(user.id);
      setUsage(data);
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return null;
  }

  if (usage.hasUnlimited) {
    return null;
  }

  const remaining = (usage.dailyLimit || 1) - usage.storiesGeneratedToday;

  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full text-sm border border-gray-700">
        <span className="text-gray-400">Stories today:</span>
        <span className="font-semibold text-white">
          {usage.storiesGeneratedToday} / {usage.dailyLimit}
        </span>
      </div>
      {remaining === 0 && onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
        >
          Upgrade to Pro
        </button>
      )}
    </div>
  );
}
