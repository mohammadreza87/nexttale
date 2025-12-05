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
  Sword
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
    { icon: Skull, name: "Thriller", color: "from-gray-700 to-gray-900" },
    { icon: Heart, name: "Romance", color: "from-rose-500 to-pink-600" },
    { icon: Sword, name: "Fantasy", color: "from-purple-600 to-indigo-700" },
    { icon: Zap, name: "Sci-Fi", color: "from-cyan-500 to-blue-600" },
    { icon: Flame, name: "Drama", color: "from-orange-500 to-red-600" },
    { icon: Brain, name: "Mystery", color: "from-emerald-600 to-teal-700" },
  ];

  const faqs = [
    {
      question: "What kind of stories can I create?",
      answer: "Next Tale supports a wide range of genres including thriller, romance, fantasy, sci-fi, drama, mystery, and more. You can create stories with complex characters, moral dilemmas, and mature themes suitable for adult readers."
    },
    {
      question: "How does the AI create personalized stories?",
      answer: "Our AI uses advanced language models to generate unique, immersive narratives based on your preferences. Describe your ideal scenario—a noir detective story, a forbidden romance, an epic fantasy quest—and the AI crafts a complete illustrated story with multiple branching paths."
    },
    {
      question: "Is this appropriate for all ages?",
      answer: "Next Tale is designed for adults (18+). While we don't allow explicit content, stories may contain mature themes, complex moral choices, violence, and romantic elements appropriate for adult fiction."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes! You can cancel your Pro subscription at any time. There are no long-term contracts or cancellation fees. You'll continue to have access until the end of your billing period."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/nexttale-logo.png" alt="Next Tale" className="w-8 h-8" />
            <span className="font-extrabold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">NEXT TALE</span>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-5 py-2 rounded-full text-sm hover:opacity-90 transition-opacity shadow-lg"
          >
            Start Writing
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 pt-16">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Copy */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-gray-300 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI-Powered Interactive Fiction</span>
              </div>

              {/* Main headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                Your Story.
                <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                  Your Choices.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Immersive AI-generated stories where every decision shapes your destiny.
                <span className="text-purple-400 font-semibold"> Thriller. Romance. Fantasy. Mystery.</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 justify-center lg:justify-start">
                <button
                  onClick={onGetStarted}
                  className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto justify-center"
                >
                  <Play className="w-5 h-5" />
                  Begin Your Tale
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Trust signals */}
              <div className="flex flex-col sm:flex-row items-center gap-4 text-gray-500 justify-center lg:justify-start">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                  <span className="ml-2 font-medium text-gray-400">4.8/5 rating</span>
                </div>
                <div className="hidden sm:block w-px h-6 bg-gray-700"></div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield className="w-5 h-5" />
                  <span>Adults 18+</span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mt-4">
                2 free stories daily. No credit card required.
              </p>
            </div>

            {/* Right side - Visual demo */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main story card mockup */}
                <div className="bg-gray-900 rounded-3xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-gray-800">
                  <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 mb-4 flex items-center justify-center overflow-hidden">
                    {featuredStories[0]?.cover_image_url ? (
                      <img
                        src={featuredStories[0].cover_image_url}
                        alt="Story preview"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <Feather className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                        <p className="text-purple-400 font-medium">Your story awaits...</p>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">
                    {featuredStories[0]?.title || "The Midnight Conspiracy"}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">A critical moment. What do you do?</p>
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-3 border border-purple-500/30 cursor-pointer hover:border-purple-400 transition-colors">
                      <p className="text-sm font-medium text-gray-200">Confront the stranger directly</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors">
                      <p className="text-sm font-medium text-gray-300">Follow them into the shadows</p>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  AI Illustrated
                </div>
                <div className="absolute -bottom-4 -right-4 bg-gray-800 text-gray-200 px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 border border-gray-700">
                  <Mic className="w-4 h-4 text-purple-400" />
                  Voice Narration
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 animate-bounce hidden lg:block">
            <ChevronDown className="w-8 h-8" />
          </div>
        </div>
      </section>

      {/* Genres Section */}
      <section className="py-16 lg:py-24 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-purple-400 bg-purple-400/10 px-4 py-2 rounded-full mb-4 border border-purple-400/20">
              GENRES
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Every Genre. Every Mood.
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From heart-pounding thrillers to sweeping romances—craft the story you want to live.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {genres.map((genre, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${genre.color} rounded-2xl p-6 text-center cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}
              >
                <genre.icon className="w-10 h-10 text-white mx-auto mb-3" />
                <p className="text-white font-bold">{genre.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-purple-400 bg-purple-400/10 px-4 py-2 rounded-full mb-4 border border-purple-400/20">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Create Your Perfect Story
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From concept to immersive experience in seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                step: 1,
                title: "Describe Your Vision",
                description: "Tell us about your ideal story—genre, setting, characters, tone."
              },
              {
                icon: Brain,
                step: 2,
                title: "AI Crafts Your Tale",
                description: "Our AI generates a unique story with illustrations and narration."
              },
              {
                icon: GitBranch,
                step: 3,
                title: "Make Your Choices",
                description: "At every turn, decide what happens next. Your choices matter."
              },
              {
                icon: Star,
                step: 4,
                title: "Discover All Endings",
                description: "Multiple paths, multiple conclusions. Replay to explore them all."
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 h-full transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                    <item.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Image, title: "Cinematic Illustrations", description: "AI-generated artwork that brings every scene to life with stunning detail." },
              { icon: Mic, title: "Dramatic Narration", description: "Professional voice acting that draws you deeper into the story." },
              { icon: GitBranch, title: "Branching Narratives", description: "Hundreds of possible paths. Your decisions create unique experiences." },
              { icon: Clock, title: "Instant Creation", description: "Full stories generated in seconds. No waiting, just immersion." },
              { icon: Feather, title: "Quality Writing", description: "Compelling prose, complex characters, and meaningful choices." },
              { icon: BookOpen, title: "Endless Possibilities", description: "Any genre, any setting, any story you can imagine." }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-purple-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-purple-400 bg-purple-400/10 px-4 py-2 rounded-full mb-4 border border-purple-400/20">
              EXPLORE
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trending Stories
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Dive into stories created by our community
            </p>
          </div>

          {loadingStories ? (
            <div className="flex justify-center py-12">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : featuredStories.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {featuredStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => onSelectStory(story.id)}
                  className="group bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10"
                >
                  <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                    {story.cover_image_url ? (
                      <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-gray-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg line-clamp-1">{story.title}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4">{story.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {story.estimated_duration} min
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-purple-400 font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        {story.likes_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Stories coming soon! Be the first to create one.</p>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
            >
              Explore All Stories
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-purple-400 bg-purple-400/10 px-4 py-2 rounded-full mb-4 border border-purple-400/20">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Readers Love Next Tale
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Finally, interactive fiction that doesn't feel childish. The AI writing is genuinely compelling.",
                name: "Alex R.",
                role: "Thriller enthusiast"
              },
              {
                quote: "I've replayed my favorite story 5 times and still find new paths. Absolutely addictive.",
                name: "Maya K.",
                role: "Romance reader"
              },
              {
                quote: "The narration quality is incredible. It's like having an audiobook that responds to my choices.",
                name: "Jordan T.",
                role: "Fantasy lover"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-950 rounded-3xl p-8 border border-gray-800 hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic text-lg leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
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
      <section className="py-16 lg:py-24 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-purple-400 bg-purple-400/10 px-4 py-2 rounded-full mb-4 border border-purple-400/20">
              PRICING
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free. Upgrade for unlimited storytelling.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Tier */}
            <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-gray-700 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-gray-500 mb-6">Perfect for exploring</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">$0</span>
                <span className="text-gray-500 ml-2">/forever</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "2 story generations per day",
                  "Unlimited reading",
                  "AI illustrations",
                  "Basic narration"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-400">
                    <Check className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full py-4 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-700 transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 relative overflow-hidden transform hover:scale-[1.02] transition-transform border border-purple-500/30">
              <div className="absolute top-4 right-4 bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-purple-200 mb-6">Unlimited storytelling</p>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">$15</span>
                <span className="text-purple-200 ml-2">/month</span>
              </div>
              <p className="text-purple-300 text-sm mb-6">or $150/year (save $30)</p>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited story generations",
                  "Premium voice narration",
                  "Priority processing",
                  "Edit & customize stories",
                  "Everything in Free"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-white">
                    <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full py-4 bg-white text-purple-700 font-bold rounded-2xl hover:bg-gray-100 transition-colors"
              >
                Start Pro Trial
              </button>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              30-day money-back guarantee. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-purple-400 bg-purple-400/10 px-4 py-2 rounded-full mb-4 border border-purple-400/20">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-gray-900 transition-colors"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-purple-900 via-gray-950 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <img src="/nexttale-logo.png" alt="Next Tale" className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Your Next Adventure Awaits
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of readers who've discovered the future of interactive fiction.
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg px-10 py-5 rounded-full shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
          >
            <Sparkles className="w-6 h-6" />
            Begin Your Tale
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-6 text-gray-500 text-sm">
            No credit card required. Start in 30 seconds.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-950 text-gray-500 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/nexttale-logo.png" alt="Next Tale" className="w-10 h-10" />
              <span className="text-white font-bold text-xl">NEXT TALE</span>
            </div>
            <p className="text-sm text-center md:text-left">
              AI-powered interactive fiction for adults
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="mailto:support@nexttale.app" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} Next Tale. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
