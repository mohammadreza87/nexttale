import { useState } from 'react';
import { Home, User, Menu, X, Sparkles, Crown, Target } from 'lucide-react';

type ViewKey = 'home' | 'profile' | 'create' | 'subscription' | 'quests';

interface SidebarProps {
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  isPro?: boolean;
}

export function Sidebar({ currentView, onNavigate, isPro = false }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavigate = (view: ViewKey) => {
    onNavigate(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger button only */}
      <button
        onClick={toggleSidebar}
        className="fixed left-5 top-5 z-[100] rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-3 shadow-xl transition-all hover:scale-110 hover:shadow-2xl active:scale-95 lg:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-70 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Dark theme for Next Tale */}
      <aside
        className={`fixed left-0 top-0 z-[90] h-full w-64 transition-all duration-300 ease-in-out lg:translate-x-0 lg:border-r lg:border-gray-800 lg:bg-gray-900/95 lg:shadow-xl lg:backdrop-blur-xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} bg-gray-900 shadow-2xl lg:block`}
      >
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="border-b border-gray-800 px-6 pb-6 pt-8">
            <div className="flex flex-col items-center gap-3">
              <img src="/nexttale-logo.png" alt="Next Tale" className="h-16 w-16" />
              <div className="text-center">
                <h2 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-extrabold text-transparent">
                  NEXT TALE
                </h2>
                <p className="mt-1 text-[10px] font-extrabold tracking-wider text-gray-500">
                  YOUR STORY, YOUR CHOICES
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {/* Explore (Home) */}
              <li>
                <button
                  onClick={() => handleNavigate('home')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    currentView === 'home'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Home className="h-5 w-5" />
                  <span>Explore</span>
                </button>
              </li>

              {/* Quests */}
              <li>
                <button
                  onClick={() => handleNavigate('quests')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    currentView === 'quests'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Target className="h-5 w-5" />
                  <span>Challenges</span>
                </button>
              </li>

              {/* Create */}
              <li>
                <button
                  onClick={() => handleNavigate('create')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    currentView === 'create'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Create</span>
                </button>
              </li>

              {/* Upgrade - Hidden if Pro */}
              {!isPro && (
                <li>
                  <button
                    onClick={() => handleNavigate('subscription')}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                      currentView === 'subscription'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white shadow-lg'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Crown className="h-5 w-5" />
                    <span>Upgrade to Pro</span>
                  </button>
                </li>
              )}

              {/* Profile */}
              <li>
                <button
                  onClick={() => handleNavigate('profile')}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    currentView === 'profile'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-800 p-4">
            <p className="mb-2 text-center text-xs font-medium text-gray-500">Your story awaits</p>
            <div className="flex items-center justify-center gap-3 text-[10px] text-gray-600">
              <a href="/terms" className="transition-colors hover:text-gray-400">
                Terms
              </a>
              <span>·</span>
              <a href="/privacy" className="transition-colors hover:text-gray-400">
                Privacy
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
