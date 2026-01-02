import { Star, Flame, Trophy } from 'lucide-react';
import type { UserSubscription } from '../../../lib/subscriptionService';

interface ProfileStatsRowProps {
  subscription: UserSubscription | null;
  isPro: boolean;
  streak: {
    current_streak: number;
    longest_streak: number;
  };
  showPointsPopup: boolean;
  onShowPointsPopup: () => void;
  onClosePointsPopup: () => void;
}

export function ProfileStatsRow({
  subscription,
  isPro,
  streak,
  showPointsPopup,
  onShowPointsPopup,
  onClosePointsPopup,
}: ProfileStatsRowProps) {
  return (
    <>
      {/* Stats Cards Row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {/* Points */}
        <button
          onClick={onShowPointsPopup}
          className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500">
            <Star className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{subscription?.total_points || 0}</p>
          <p className="text-xs font-medium text-gray-400">Points</p>
        </button>

        {/* Current Streak */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center shadow-lg">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{streak.current_streak}</p>
          <p className="text-xs font-medium text-gray-400">Current Streak</p>
        </div>

        {/* Longest Streak */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-center shadow-lg">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-white">{streak.longest_streak}</p>
          <p className="text-xs font-medium text-gray-400">Longest Streak</p>
        </div>
      </div>

      {/* Points Breakdown Popup */}
      {showPointsPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={onClosePointsPopup}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className={`h-6 w-6 ${isPro ? 'text-purple-400' : 'text-blue-400'}`} />
                <h3 className="text-xl font-bold text-white">Points Breakdown</h3>
              </div>
              <button
                onClick={onClosePointsPopup}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-green-900/30 p-3">
                <span className="font-medium text-gray-300">Reading Points</span>
                <span className="text-xl font-bold text-green-400">
                  {subscription?.reading_points || 0}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-purple-900/30 p-3">
                <span className="font-medium text-gray-300">Creating Points</span>
                <span className="text-xl font-bold text-purple-400">
                  {subscription?.creating_points || 0}
                </span>
              </div>
              <div
                className={`flex items-center justify-between rounded-xl p-4 ${isPro ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}
              >
                <span className="font-semibold text-white">Total Points</span>
                <span className="text-2xl font-bold text-white">
                  {subscription?.total_points || 0}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-gray-800 p-3">
              <p className="text-xs text-gray-400">
                <strong className="text-gray-300">How to earn:</strong> 1 point per chapter, 5
                points for completing a story, 5 points for creating a story!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
