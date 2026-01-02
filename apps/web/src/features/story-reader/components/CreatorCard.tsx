import { User } from 'lucide-react';
import { getSafeDisplayName } from '../../../lib/displayName';

interface CreatorCardProps {
  creator: {
    display_name: string | null;
    avatar_url: string | null;
  };
  createdBy?: string | null;
  onViewProfile?: (userId: string) => void;
  isPro?: boolean;
}

export function CreatorCard({ creator, createdBy, onViewProfile, isPro = false }: CreatorCardProps) {
  const handleClick = () => {
    if (createdBy && onViewProfile) {
      onViewProfile(createdBy);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-4 rounded-2xl bg-gray-800 p-4 shadow-md transition-all hover:bg-gray-700 hover:shadow-lg"
    >
      {creator.avatar_url ? (
        <img
          src={creator.avatar_url}
          alt={getSafeDisplayName(creator.display_name, 'Creator')}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isPro
              ? 'bg-gradient-to-br from-purple-900 to-pink-900'
              : 'bg-gradient-to-br from-blue-900 to-cyan-900'
          }`}
        >
          <User className="h-6 w-6 text-gray-300" />
        </div>
      )}
      <div className="flex-1 text-left">
        <p className="text-xs text-gray-400">Created by</p>
        <p className="text-base font-bold text-white">
          {getSafeDisplayName(creator.display_name, 'Anonymous')}
        </p>
      </div>
      <div className="text-gray-500">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
