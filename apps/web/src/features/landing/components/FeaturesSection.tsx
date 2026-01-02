import { Image, Mic, GitBranch, Clock, Feather, BookOpen } from 'lucide-react';

const FEATURES = [
  {
    icon: Image,
    title: 'Cinematic Illustrations',
    description:
      'AI-generated artwork that brings every scene to life with stunning detail.',
  },
  {
    icon: Mic,
    title: 'Dramatic Narration',
    description: 'Professional voice acting that draws you deeper into the story.',
  },
  {
    icon: GitBranch,
    title: 'Branching Narratives',
    description:
      'Hundreds of possible paths. Your decisions create unique experiences.',
  },
  {
    icon: Clock,
    title: 'Instant Creation',
    description: 'Full stories generated in seconds. No waiting, just immersion.',
  },
  {
    icon: Feather,
    title: 'Quality Writing',
    description: 'Compelling prose, complex characters, and meaningful choices.',
  },
  {
    icon: BookOpen,
    title: 'Endless Possibilities',
    description: 'Any genre, any setting, any story you can imagine.',
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-gray-950 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-purple-500/30"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                <feature.icon className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="mb-1 font-bold text-white">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
