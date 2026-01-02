import { Sparkles, Brain, GitBranch, Star, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    icon: Sparkles,
    step: 1,
    title: 'Describe Your Vision',
    description: 'Tell us about your ideal story—genre, setting, characters, tone.',
  },
  {
    icon: Brain,
    step: 2,
    title: 'AI Crafts Your Tale',
    description: 'Our AI generates a unique story with illustrations and narration.',
  },
  {
    icon: GitBranch,
    step: 3,
    title: 'Make Your Choices',
    description: 'At every turn, decide what happens next. Your choices matter.',
  },
  {
    icon: Star,
    step: 4,
    title: 'Discover All Endings',
    description: 'Multiple paths, multiple conclusions. Replay to explore them all.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
            HOW IT WORKS
          </span>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Create Your Perfect Story
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            From concept to immersive experience in seconds.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {STEPS.map((item, index) => (
            <div key={index} className="group relative">
              <div className="h-full rounded-3xl border border-gray-800 bg-gray-900 p-6 transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                  <item.icon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-bold text-white shadow-lg">
                  {item.step}
                </div>
                <h3 className="mb-2 font-bold text-white">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              {index < 3 && (
                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 transform md:block">
                  <ChevronRight className="h-6 w-6 text-gray-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
