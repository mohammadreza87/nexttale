import { Home, User, Sparkles, Crown, Target, Compass } from 'lucide-react';

type ViewKey = 'home' | 'feed' | 'profile' | 'create' | 'subscription' | 'quests';

interface BottomNavProps {
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  isPro?: boolean;
}

export function BottomNav({ currentView, onNavigate, isPro = false }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-900 shadow-lg">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`mx-1 my-2 flex h-full flex-1 flex-col items-center justify-center rounded-xl transition-all ${
            currentView === 'home'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'text-gray-500'
          }`}
        >
          <Home className="h-6 w-6" />
          <span className="mt-1 text-xs font-medium">Home</span>
        </button>

        {/* Feed */}
        <button
          onClick={() => onNavigate('feed')}
          className={`mx-1 my-2 flex h-full flex-1 flex-col items-center justify-center rounded-xl transition-all ${
            currentView === 'feed'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'text-gray-500'
          }`}
        >
          <Compass className="h-6 w-6" />
          <span className="mt-1 text-xs font-medium">Explore</span>
        </button>

        {/* Challenges */}
        <button
          onClick={() => onNavigate('quests')}
          className={`mx-1 my-2 flex h-full flex-1 flex-col items-center justify-center rounded-xl transition-all ${
            currentView === 'quests'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'text-gray-500'
          }`}
        >
          <Target className="h-6 w-6" />
          <span className="mt-1 text-xs font-medium">Challenges</span>
        </button>

        {/* Create */}
        <button
          onClick={() => onNavigate('create')}
          className={`mx-1 my-2 flex h-full flex-1 flex-col items-center justify-center rounded-xl transition-all ${
            currentView === 'create'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'text-gray-500'
          }`}
        >
          <Sparkles className="h-6 w-6" />
          <span className="mt-1 text-xs font-medium">Create</span>
        </button>

        {/* Pro - Hidden if user is Pro */}
        {!isPro && (
          <button
            onClick={() => onNavigate('subscription')}
            className={`mx-1 my-2 flex h-full flex-1 flex-col items-center justify-center rounded-xl transition-all ${
              currentView === 'subscription'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-500'
            }`}
          >
            <Crown className="h-6 w-6" />
            <span className="mt-1 text-xs font-medium">Pro</span>
          </button>
        )}

        {/* Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className={`mx-1 my-2 flex h-full flex-1 flex-col items-center justify-center rounded-xl transition-all ${
            currentView === 'profile'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'text-gray-500'
          }`}
        >
          <User className="h-6 w-6" />
          <span className="mt-1 text-xs font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
