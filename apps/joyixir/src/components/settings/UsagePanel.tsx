/**
 * Usage Panel
 * Shows activity stats and usage metrics with remaining messages prominently displayed
 */

import { Zap, MessageSquare, Folder, Flame } from 'lucide-react';
import type { UsageStats } from '../../types';

interface UsagePanelProps {
  usageStats: UsageStats | null;
}

export function UsagePanel({ usageStats }: UsagePanelProps) {
  const creditsRemaining = usageStats?.creditsRemaining ?? 0;
  const totalCredits = usageStats?.totalCredits ?? 50;
  const usagePercentage = totalCredits > 0 ? ((totalCredits - creditsRemaining) / totalCredits) * 100 : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Usage</h2>
      <p className="mt-1 text-gray-400">Monitor your AI usage and activity.</p>

      {/* Remaining Messages - Prominent Display */}
      <div className="mt-8 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20">
              <MessageSquare className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Remaining Messages</p>
              <p className="text-3xl font-bold text-white">
                {creditsRemaining}
                <span className="ml-1 text-lg font-normal text-gray-500">/ {totalCredits}</span>
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500">
            <Zap className="h-4 w-4" />
            Upgrade
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {usagePercentage.toFixed(0)}% of your monthly messages used
          </p>
        </div>
      </div>

      {/* Activity Graph */}
      <div className="mt-6 rounded-xl border border-gray-800 bg-gray-800/30 p-6">
        <h3 className="font-medium text-white">Activity this year</h3>
        <div className="mt-4 grid grid-cols-[repeat(52,1fr)] gap-1">
          {Array.from({ length: 364 }).map((_, i) => {
            // Create some visual variation based on index
            const intensity = Math.random();
            let bgColor = 'bg-gray-700';
            if (i > 300) {
              if (intensity > 0.8) bgColor = 'bg-violet-500';
              else if (intensity > 0.6) bgColor = 'bg-violet-600/70';
              else if (intensity > 0.4) bgColor = 'bg-violet-700/50';
            }
            return <div key={i} className={`aspect-square rounded-sm ${bgColor}`} />;
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Folder}
          label="Projects"
          value={usageStats?.projectsCount || 0}
        />
        <StatCard
          icon={MessageSquare}
          label="Messages used"
          value={usageStats?.creditsUsed || 0}
        />
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${usageStats?.currentStreak || 0}d`}
        />
        <StatCard
          icon={Zap}
          label="Daily average"
          value={usageStats?.dailyAverage?.toFixed(1) || '0'}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: typeof Zap;
  label: string;
  value: string | number;
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
