import { Sparkles, Zap, Code2, Gamepad2, Wrench, HelpCircle } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

export function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-xl font-extrabold text-transparent">
              NextForge
            </span>
          </div>
          <button
            onClick={onSignIn}
            className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI-Powered Game Builder</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-6xl">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Build Games & Tools
            </span>
            <br />
            <span className="text-white">With Just Words</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
            Describe what you want to create, and watch AI build it instantly. Iterate through
            conversation. No coding required.
          </p>

          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40"
          >
            <Sparkles className="h-5 w-5" />
            Start Creating Free
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            What Can You Build?
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Gamepad2,
                title: 'Games',
                description: 'Platformers, puzzles, arcade games, and more',
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: Wrench,
                title: 'Tools',
                description: 'Calculators, converters, and utilities',
                color: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Code2,
                title: 'Widgets',
                description: 'Clocks, counters, and mini-apps',
                color: 'from-purple-500 to-violet-500',
              },
              {
                icon: HelpCircle,
                title: 'Quizzes',
                description: 'Interactive quizzes and trivia',
                color: 'from-yellow-500 to-orange-500',
              },
            ].map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group rounded-2xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-gray-700 hover:bg-gray-900"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-gray-800 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">How It Works</h2>

          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Describe Your Idea',
                description:
                  'Tell the AI what you want to build. Be as specific or general as you like.',
              },
              {
                step: '2',
                title: 'Watch It Come to Life',
                description:
                  'AI generates a working prototype instantly. Preview it in real-time.',
              },
              {
                step: '3',
                title: 'Iterate & Refine',
                description:
                  'Keep chatting to make changes. "Make it faster", "Add a score counter", etc.',
              },
              {
                step: '4',
                title: 'Share & Publish',
                description:
                  'Save your creation and share it with the world. Get a unique link.',
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-600 text-lg font-bold text-white">
                  {step}
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-white">{title}</h3>
                  <p className="text-gray-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Build?</h2>
          <p className="mb-8 text-gray-400">
            Join thousands of creators building amazing things with AI.
          </p>
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:scale-105"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">NextForge by NextTale</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="https://nexttale.app/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="https://nexttale.app/terms" className="hover:text-white">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
