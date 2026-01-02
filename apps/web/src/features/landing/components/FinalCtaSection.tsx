import { Sparkles, ArrowRight } from 'lucide-react';

interface FinalCtaSectionProps {
  onGetStarted: () => void;
}

export function FinalCtaSection({ onGetStarted }: FinalCtaSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-gray-950 to-pink-900 py-20 lg:py-32">
      <div className="absolute inset-0">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <img src="/nexttale-logo.png" alt="Next Tale" className="mx-auto mb-6 h-16 w-16" />
        <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">
          Your Next Adventure Awaits
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-300">
          Join thousands of readers who've discovered the future of interactive fiction.
        </p>
        <button
          onClick={onGetStarted}
          className="group inline-flex transform items-center gap-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-5 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
        >
          <Sparkles className="h-6 w-6" />
          Begin Your Tale
          <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
        </button>
        <p className="mt-6 text-sm text-gray-500">
          No credit card required. Start in 30 seconds.
        </p>
      </div>
    </section>
  );
}
