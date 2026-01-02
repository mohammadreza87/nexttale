interface LandingHeaderProps {
  onGetStarted: () => void;
}

export function LandingHeader({ onGetStarted }: LandingHeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/nexttale-logo.png" alt="Next Tale" className="h-8 w-8" />
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-xl font-extrabold text-transparent">
            NEXT TALE
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
        >
          Start Writing
        </button>
      </div>
    </header>
  );
}
