import { Home, User, Sparkles, Crown, Target } from 'lucide-react';

interface BottomNavProps {
  currentView: 'home' | 'profile' | 'create' | 'subscription' | 'quests';
  onNavigate: (view: 'home' | 'profile' | 'create' | 'subscription' | 'quests') => void;
  isPro?: boolean;
}

export function BottomNav({ currentView, onNavigate, isPro = false }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 shadow-lg z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full mx-1 my-2 rounded-xl transition-all ${
            currentView === 'home' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-500'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Home</span>
        </button>

        {/* Challenges */}
        <button
          onClick={() => onNavigate('quests')}
          className={`flex flex-col items-center justify-center flex-1 h-full mx-1 my-2 rounded-xl transition-all ${
            currentView === 'quests' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-500'
          }`}
        >
          <Target className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Challenges</span>
        </button>

        {/* Create */}
        <button
          onClick={() => onNavigate('create')}
          className={`flex flex-col items-center justify-center flex-1 h-full mx-1 my-2 rounded-xl transition-all ${
            currentView === 'create' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-500'
          }`}
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Create</span>
        </button>

        {/* Pro - Hidden if user is Pro */}
        {!isPro && (
          <button
            onClick={() => onNavigate('subscription')}
            className={`flex flex-col items-center justify-center flex-1 h-full mx-1 my-2 rounded-xl transition-all ${
              currentView === 'subscription' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-500'
            }`}
          >
            <Crown className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Pro</span>
          </button>
        )}

        {/* Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full mx-1 my-2 rounded-xl transition-all ${
            currentView === 'profile' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-gray-500'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1 font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
