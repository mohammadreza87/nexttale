import { useState } from 'react';
import { Home, User, Menu, X, Sparkles, Crown, Target } from 'lucide-react';

interface SidebarProps {
  currentView: 'home' | 'profile' | 'create' | 'subscription' | 'quests';
  onNavigate: (view: 'home' | 'profile' | 'create' | 'subscription' | 'quests') => void;
  isPro?: boolean;
}

export function Sidebar({ currentView, onNavigate, isPro = false }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavigate = (view: 'home' | 'profile' | 'create' | 'subscription' | 'quests') => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button only */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-5 left-5 z-[100] p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-70 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Dark theme for Next Tale */}
      <aside
        className={`fixed top-0 left-0 h-full z-[90] transition-all duration-300 ease-in-out w-64
          lg:translate-x-0 lg:backdrop-blur-xl lg:bg-gray-900/95 lg:border-r lg:border-gray-800 lg:shadow-xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:block bg-gray-900 shadow-2xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="pt-8 px-6 pb-6 border-b border-gray-800">
            <div className="flex flex-col items-center gap-3">
              <img src="/nexttale-logo.png" alt="Next Tale" className="w-16 h-16" />
              <div className="text-center">
                <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  NEXT TALE
                </h2>
                <p className="text-[10px] font-extrabold text-gray-500 tracking-wider mt-1">
                  YOUR STORY, YOUR CHOICES
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {/* Home */}
              <li>
                <button
                  onClick={() => handleNavigate('home')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    currentView === 'home'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>
              </li>

              {/* Quests */}
              <li>
                <button
                  onClick={() => handleNavigate('quests')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    currentView === 'quests'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Target className="w-5 h-5" />
                  <span>Challenges</span>
                </button>
              </li>

              {/* Create */}
              <li>
                <button
                  onClick={() => handleNavigate('create')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    currentView === 'create'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Create</span>
                </button>
              </li>

              {/* Upgrade - Hidden if Pro */}
              {!isPro && (
                <li>
                  <button
                    onClick={() => handleNavigate('subscription')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      currentView === 'subscription'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Crown className="w-5 h-5" />
                    <span>Upgrade to Pro</span>
                  </button>
                </li>
              )}

              {/* Profile */}
              <li>
                <button
                  onClick={() => handleNavigate('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    currentView === 'profile'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center font-medium mb-2">
              Your story awaits
            </p>
            <div className="flex items-center justify-center gap-3 text-[10px] text-gray-600">
              <a href="/terms" className="hover:text-gray-400 transition-colors">Terms</a>
              <span>·</span>
              <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
