import { Sparkles, Zap, Layout, Database, Globe, Smartphone, Github, Palette } from 'lucide-react';

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-xl font-extrabold text-transparent">
              Joyixir
            </span>
          </div>
          <button
            onClick={onSignIn}
            className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2">
            <Zap className="h-4 w-4 text-violet-400" />
            <span className="text-sm text-violet-300">The Magic Potion for Building Apps</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-6xl">
            <span className="bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
              Idea to App
            </span>
            <br />
            <span className="text-white">In Minutes</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
            Describe your app in plain English. Watch AI write the code, install packages,
            and run it live. Edit any file, iterate through chat, deploy anywhere.
          </p>

          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
          >
            <Sparkles className="h-5 w-5" />
            Start Building Free
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Everything You Need
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Layout,
                title: 'React + Vite',
                description: 'Modern stack with hot reload and TypeScript',
                color: 'from-cyan-500 to-blue-500',
              },
              {
                icon: Palette,
                title: 'shadcn/ui',
                description: 'Beautiful components out of the box',
                color: 'from-violet-500 to-purple-500',
              },
              {
                icon: Database,
                title: 'Supabase',
                description: 'Database, auth & storage in one click',
                color: 'from-emerald-500 to-green-500',
              },
              {
                icon: Globe,
                title: 'Three.js',
                description: '3D experiences and WebGL support',
                color: 'from-orange-500 to-red-500',
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
                title: 'Describe Your App',
                description:
                  'Tell Joyixir what you want to build. "Create a todo app with dark mode and Supabase backend."',
              },
              {
                step: '2',
                title: 'Watch It Build',
                description:
                  'AI generates real project files, installs npm packages, and starts the dev server - all in your browser.',
              },
              {
                step: '3',
                title: 'Edit & Iterate',
                description:
                  'Browse the file tree, edit code directly, or chat to make changes. "Add user authentication."',
              },
              {
                step: '4',
                title: 'Export & Deploy',
                description:
                  'Push to GitHub with one click or download the project. Deploy to Vercel, Netlify, or anywhere.',
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-lg font-bold text-white">
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

      {/* Export Options */}
      <section className="border-t border-gray-800 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Your Code, Your Way</h2>
          <p className="mb-8 text-gray-400">
            Full ownership of your code. Export anytime, deploy anywhere.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
              <Github className="h-5 w-5 text-gray-300" />
              <span className="text-gray-300">Push to GitHub</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
              <Smartphone className="h-5 w-5 text-gray-300" />
              <span className="text-gray-300">Download ZIP</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
              <Globe className="h-5 w-5 text-gray-300" />
              <span className="text-gray-300">Deploy to Vercel</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-800 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Build?</h2>
          <p className="mb-8 text-gray-400">
            Join developers shipping faster with AI.
          </p>
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:scale-105"
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
            <span className="text-sm">Joyixir</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
