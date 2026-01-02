import { Gamepad2, Music } from 'lucide-react';

export type ProfileTabType = 'completed' | 'created' | 'interactive' | 'music';

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  isPro: boolean;
  createdTotal: number;
  completedTotal: number;
  onTabChange: (tab: ProfileTabType) => void;
}

export function ProfileTabs({
  activeTab,
  isPro,
  createdTotal,
  completedTotal,
  onTabChange,
}: ProfileTabsProps) {
  const activeGradient = isPro
    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg';

  const inactiveStyle = 'bg-gray-800 text-gray-400 shadow-md hover:bg-gray-700';

  return (
    <div className="flex gap-2 p-2">
      <button
        onClick={() => onTabChange('created')}
        className={`flex-1 rounded-xl px-3 py-3 text-center font-semibold transition-all ${
          activeTab === 'created' ? activeGradient : inactiveStyle
        }`}
      >
        <span className="block text-lg font-bold">{createdTotal}</span>
        <span className="text-xs">Stories</span>
      </button>
      <button
        onClick={() => onTabChange('interactive')}
        className={`flex-1 rounded-xl px-3 py-3 text-center font-semibold transition-all ${
          activeTab === 'interactive' ? activeGradient : inactiveStyle
        }`}
      >
        <Gamepad2 className="mx-auto mb-1 h-5 w-5" />
        <span className="text-xs">Games</span>
      </button>
      <button
        onClick={() => onTabChange('music')}
        className={`flex-1 rounded-xl px-3 py-3 text-center font-semibold transition-all ${
          activeTab === 'music' ? activeGradient : inactiveStyle
        }`}
      >
        <Music className="mx-auto mb-1 h-5 w-5" />
        <span className="text-xs">Music</span>
      </button>
      <button
        onClick={() => onTabChange('completed')}
        className={`flex-1 rounded-xl px-3 py-3 text-center font-semibold transition-all ${
          activeTab === 'completed' ? activeGradient : inactiveStyle
        }`}
      >
        <span className="block text-lg font-bold">{completedTotal}</span>
        <span className="text-xs">Played</span>
      </button>
    </div>
  );
}
