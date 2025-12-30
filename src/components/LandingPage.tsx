import { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Mic,
  Image,
  GitBranch,
  Shield,
  Clock,
  ChevronRight,
  Star,
  Play,
  Check,
  ArrowRight,
  Zap,
  Heart,
  Brain,
  Crown,
  ChevronDown,
  Skull,
  Flame,
  Sword,
  Feather,
} from 'lucide-react';
import { getStoriesPaginated } from '../lib/storyService';
import type { Story } from '../lib/types';

interface LandingPageProps {
  onGetStarted: () => void;
  onSelectStory: (storyId: string) => void;
}

export function LandingPage({ onGetStarted, onSelectStory }: LandingPageProps) {
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    loadFeaturedStories();
  }, []);

  const loadFeaturedStories = async () => {
    try {
      const result = await getStoriesPaginated(3, 0);
      setFeaturedStories(result.data);
    } catch (error) {
      console.error('Error loading featured stories:', error);
    } finally {
      setLoadingStories(false);
    }
  };

  const genres = [
    { icon: Skull, name: 'Thriller', color: 'from-gray-700 to-gray-900' },
    { icon: Heart, name: 'Romance', color: 'from-rose-500 to-pink-600' },
    { icon: Sword, name: 'Fantasy', color: 'from-purple-600 to-indigo-700' },
    { icon: Zap, name: 'Sci-Fi', color: 'from-cyan-500 to-blue-600' },
    { icon: Flame, name: 'Drama', color: 'from-orange-500 to-red-600' },
    { icon: Brain, name: 'Mystery', color: 'from-emerald-600 to-teal-700' },
  ];

  const faqs = [
    {
      question: 'What kind of stories can I create?',
      answer:
        'Next Tale supports a wide range of genres including thriller, romance, fantasy, sci-fi, drama, mystery, and more. You can create stories with complex characters, moral dilemmas, and mature themes suitable for adult readers.',
    },
    {
      question: 'How does the AI create personalized stories?',
      answer:
        'Our AI uses advanced language models to generate unique, immersive narratives based on your preferences. Describe your ideal scenario—a noir detective story, a forbidden romance, an epic fantasy quest—and the AI crafts a complete illustrated story with multiple branching paths.',
    },
    {
      question: 'Is this appropriate for all ages?',
      answer:
        "Next Tale is designed for adults (18+). While we don't allow explicit content, stories may contain mature themes, complex moral choices, violence, and romantic elements appropriate for adult fiction.",
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer:
        "Yes! You can cancel your Pro subscription at any time. There are no long-term contracts or cancellation fees. You'll continue to have access until the end of your billing period.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Fixed Header */}
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

      {/* Hero Section */}
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
                    {featuredStories[0]?.cover_image_url ? (
                      <img
                        src={featuredStories[0].cover_image_url}
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
                    {featuredStories[0]?.title || 'The Midnight Conspiracy'}
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

      {/* Genres Section */}
      <section className="bg-gray-950 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
              GENRES
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Every Genre. Every Mood.
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-400">
              From heart-pounding thrillers to sweeping romances—craft the story you want to live.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {genres.map((genre, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${genre.color} transform cursor-pointer rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl`}
              >
                <genre.icon className="mx-auto mb-3 h-10 w-10 text-white" />
                <p className="font-bold text-white">{genre.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
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
            {[
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
            ].map((item, index) => (
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

      {/* Features Section */}
      <section className="bg-gray-950 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
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
            ].map((feature, index) => (
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

      {/* Featured Stories Section */}
      <section className="bg-gradient-to-b from-gray-950 to-gray-900 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
              EXPLORE
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Trending Stories</h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-400">
              Dive into stories created by our community
            </p>
          </div>

          {loadingStories ? (
            <div className="flex justify-center py-12">
              <div className="flex gap-2">
                <div
                  className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          ) : featuredStories.length > 0 ? (
            <div className="mb-12 grid gap-6 md:grid-cols-3">
              {featuredStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => onSelectStory(story.id)}
                  className="group transform cursor-pointer overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-16 w-16 text-gray-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="line-clamp-1 text-lg font-bold text-white">{story.title}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="mb-4 line-clamp-2 text-sm text-gray-500">{story.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {story.estimated_duration} min
                        </span>
                      </div>
                      <span className="flex items-center gap-1 font-medium text-purple-400">
                        <Star className="h-3 w-3 fill-current" />
                        {story.likes_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-600">
              <BookOpen className="mx-auto mb-4 h-16 w-16 opacity-30" />
              <p>Stories coming soon! Be the first to create one.</p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={onGetStarted}
              className="inline-flex transform items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/25"
            >
              Explore All Stories
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-900 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
              TESTIMONIALS
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Readers Love Next Tale
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "Finally, interactive fiction that doesn't feel childish. The AI writing is genuinely compelling.",
                name: 'Alex R.',
                role: 'Thriller enthusiast',
              },
              {
                quote:
                  "I've replayed my favorite story 5 times and still find new paths. Absolutely addictive.",
                name: 'Maya K.',
                role: 'Romance reader',
              },
              {
                quote:
                  "The narration quality is incredible. It's like having an audiobook that responds to my choices.",
                name: 'Jordan T.',
                role: 'Fantasy lover',
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="rounded-3xl border border-gray-800 bg-gray-950 p-8 transition-colors hover:border-purple-500/30"
              >
                <div className="mb-4 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="mb-6 text-lg italic leading-relaxed text-gray-300">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
                    <span className="font-bold text-white">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-950 py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
              PRICING
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Simple Pricing</h2>
            <p className="text-xl text-gray-400">Start free. Upgrade for unlimited storytelling.</p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
            {/* Free Tier */}
            <div className="rounded-3xl border border-gray-800 bg-gray-900 p-8 transition-colors hover:border-gray-700">
              <h3 className="mb-2 text-2xl font-bold text-white">Free</h3>
              <p className="mb-6 text-gray-500">Perfect for exploring</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="ml-2 text-gray-500">/forever</span>
              </div>
              <ul className="mb-8 space-y-4">
                {[
                  '2 story generations per day',
                  'Unlimited reading',
                  'AI illustrations',
                  'Basic narration',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-400">
                    <Check className="h-5 w-5 flex-shrink-0 text-purple-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full rounded-2xl bg-gray-800 py-4 font-bold text-white transition-colors hover:bg-gray-700"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="relative transform overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900 to-pink-900 p-8 transition-transform hover:scale-[1.02]">
              <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-yellow-900">
                <Crown className="h-3 w-3" />
                POPULAR
              </div>
              <h3 className="mb-2 text-2xl font-bold text-white">Pro</h3>
              <p className="mb-6 text-purple-200">Unlimited storytelling</p>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">$15</span>
                <span className="ml-2 text-purple-200">/month</span>
              </div>
              <p className="mb-6 text-sm text-purple-300">or $150/year (save $30)</p>
              <ul className="mb-8 space-y-4">
                {[
                  'Unlimited story generations',
                  'Premium voice narration',
                  'Priority processing',
                  'Edit & customize stories',
                  'Everything in Free',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-white">
                    <Check className="h-5 w-5 flex-shrink-0 text-yellow-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full rounded-2xl bg-white py-4 font-bold text-purple-700 transition-colors hover:bg-gray-100"
              >
                Start Pro Trial
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="flex items-center justify-center gap-2 text-gray-500">
              <Shield className="h-5 w-5 text-green-500" />
              30-day money-back guarantee. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-900 py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
              FAQ
            </span>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Common Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-gray-900"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="leading-relaxed text-gray-400">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
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

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950 py-12 text-gray-500">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <img src="/nexttale-logo.png" alt="Next Tale" className="h-10 w-10" />
              <span className="text-xl font-bold text-white">NEXT TALE</span>
            </div>
            <p className="text-center text-sm md:text-left">
              AI-powered interactive fiction for adults
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="/privacy" className="transition-colors hover:text-white">
                Privacy
              </a>
              <a href="/terms" className="transition-colors hover:text-white">
                Terms
              </a>
              <a href="mailto:support@nexttale.app" className="transition-colors hover:text-white">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Next Tale. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
