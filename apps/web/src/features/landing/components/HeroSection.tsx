import {
  Sparkles,
  Play,
  ArrowRight,
  Star,
  Shield,
  Image,
  Mic,
  Feather,
  ChevronDown,
} from 'lucide-react';
import type { Story } from '../../../lib/types';

interface HeroSectionProps {
  featuredStory: Story | undefined;
  onGetStarted: () => void;
}

export function HeroSection({ featuredStory, onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 pt-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl"></div>
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 animate-pulse rounded-full bg-pink-600/20 blur-3xl"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute right-1/4 top-1/3 h-64 w-64 animate-pulse rounded-full bg-indigo-600/10 blur-3xl"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left side - Copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-gray-300 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>AI-Powered Interactive Fiction</span>
            </div>

            {/* Main headline */}
            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
              Your Story.
              <span className="mt-2 block bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                Your Choices.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mb-8 max-w-lg text-lg leading-relaxed text-gray-400 md:text-xl lg:mx-0">
              Immersive AI-generated stories where every decision shapes your destiny.
              <span className="font-semibold text-purple-400">
                {' '}
                Thriller. Romance. Fantasy. Mystery.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <button
                onClick={onGetStarted}
                className="group flex w-full transform items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 sm:w-auto"
              >
                <Play className="h-5 w-5" />
                Begin Your Tale
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-col items-center justify-center gap-4 text-gray-500 sm:flex-row lg:justify-start">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                ))}
                <span className="ml-2 font-medium text-gray-400">4.8/5 rating</span>
              </div>
              <div className="hidden h-6 w-px bg-gray-700 sm:block"></div>
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="h-5 w-5" />
                <span>Adults 18+</span>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              2 free stories daily. No credit card required.
            </p>
          </div>

          {/* Right side - Visual demo */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main story card mockup */}
              <div className="rotate-2 transform rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-2xl transition-transform duration-500 hover:rotate-0">
                <div className="mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900">
                  {featuredStory?.cover_image_url ? (
                    <img
                      src={featuredStory.cover_image_url}
                      alt="Story preview"
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <Feather className="mx-auto mb-4 h-16 w-16 text-purple-500" />
                      <p className="font-medium text-purple-400">Your story awaits...</p>
                    </div>
                  )}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">
                  {featuredStory?.title || 'The Midnight Conspiracy'}
                </h3>
                <p className="mb-4 text-sm text-gray-500">A critical moment. What do you do?</p>
                <div className="space-y-2">
                  <div className="cursor-pointer rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3 transition-colors hover:border-purple-400">
                    <p className="text-sm font-medium text-gray-200">
                      Confront the stranger directly
                    </p>
                  </div>
                  <div className="cursor-pointer rounded-xl border border-gray-700 bg-gray-800/50 p-3 transition-colors hover:border-gray-600">
                    <p className="text-sm font-medium text-gray-300">
                      Follow them into the shadows
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -left-4 -top-4 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                <Image className="h-4 w-4" />
                AI Illustrated
              </div>
              <div className="absolute -bottom-4 -right-4 flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 shadow-lg">
                <Mic className="h-4 w-4 text-purple-400" />
                Voice Narration
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce text-gray-600 lg:block">
          <ChevronDown className="h-8 w-8" />
        </div>
      </div>
    </section>
  );
}
