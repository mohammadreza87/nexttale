/**
 * Usage Panel
 * Shows activity stats and usage metrics
 */

import type { UsageStats } from '../../types';

interface UsagePanelProps {
  usageStats: UsageStats | null;
}

export function UsagePanel({ usageStats }: UsagePanelProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Usage</h2>
      <p className="mt-1 text-gray-400">Monitor your AI usage and activity.</p>

      {/* Activity Graph */}
      <div className="mt-8 rounded-xl border border-gray-800 bg-gray-800/30 p-6">
        <h3 className="font-medium text-white">Activity this year</h3>
        <div className="mt-4 grid grid-cols-[repeat(52,1fr)] gap-1">
          {Array.from({ length: 364 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-sm bg-gray-700" />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard
          label="Projects created"
          value={usageStats?.projectsCount || 0}
        />
        <StatCard label="Credits used" value={usageStats?.creditsUsed || 0} />
        <StatCard
          label="Current streak"
          value={`${usageStats?.currentStreak || 0} day${
            usageStats?.currentStreak !== 1 ? 's' : ''
          }`}
        />
      </div>

      {/* Detailed Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <StatCard
          label="Daily average"
          value={`${usageStats?.dailyAverage?.toFixed(1) || '0.0'} edits`}
        />
        <StatCard
          label="Days edited"
          value={`${usageStats?.daysEdited || 0} (${
            usageStats?.daysEdited
              ? ((usageStats.daysEdited / 365) * 100).toFixed(0)
              : 0
          }%)`}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
