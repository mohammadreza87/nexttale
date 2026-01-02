import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Gamepad2, BookOpen, Wrench, Play, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { FeedItem } from '../lib/interactiveTypes';

interface LandingPageMinimalProps {
  onGetStarted: () => void;
}

export function LandingPageMinimal({ onGetStarted }: LandingPageMinimalProps) {
  const [featuredContent, setFeaturedContent] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRandomContent();
  }, []);

  const loadRandomContent = async () => {
    try {
      // Fetch random story or interactive content (not music)
      // Prioritize content WITH thumbnails for better visual display
      const [storiesResult, interactiveResult] = await Promise.all([
        supabase
          .from('stories')
          .select('id, title, description, cover_image_url, likes_count, estimated_duration')
          .eq('is_public', true)
          .not('cover_image_url', 'is', null)
          .order('likes_count', { ascending: false })
          .limit(10),
        supabase
          .from('interactive_content')
          .select('id, title, description, thumbnail_url, content_type, likes_count')
          .eq('is_public', true)
          .order('likes_count', { ascending: false })
          .limit(10),
      ]);

      const stories: FeedItem[] = (storiesResult.data || []).map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        feed_type: 'story' as const,
        thumbnail_url: s.cover_image_url,
        likes_count: s.likes_count || 0,
        estimated_duration: s.estimated_duration,
        preview_url: null,
        created_by: null,
        is_public: true,
        dislikes_count: 0,
        view_count: 0,
        comment_count: 0,
        created_at: null,
        creator: null,
      }));

      const interactive: FeedItem[] = (interactiveResult.data || []).map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        feed_type: i.content_type as FeedItem['feed_type'],
        thumbnail_url: i.thumbnail_url,
        likes_count: i.likes_count || 0,
        preview_url: null,
        created_by: null,
        is_public: true,
        dislikes_count: 0,
        view_count: 0,
        comment_count: 0,
        created_at: null,
        creator: null,
        estimated_duration: null,
      }));

      // Combine all content
      const all = [...stories, ...interactive];

      // Prefer content with thumbnails, but include all for variety
      const withThumbnails = all.filter((item) => item.thumbnail_url);
      const contentPool = withThumbnails.length > 0 ? withThumbnails : all;

      if (contentPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * contentPool.length);
        setFeaturedContent(contentPool[randomIndex]);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'story':
        return <BookOpen className="h-3 w-3" />;
      case 'game':
        return <Gamepad2 className="h-3 w-3" />;
      case 'tool':
      case 'widget':
        return <Wrench className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'story':
        return 'Story';
      case 'game':
        return 'Game';
      case 'tool':
        return 'Tool';
      case 'widget':
        return 'Widget';
      case 'quiz':
        return 'Quiz';
      case 'visualization':
        return 'Visualization';
      default:
        return 'Content';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Minimal Header */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/nexttale-logo.png" alt="Next Tale" className="h-8 w-8" />
            <span className="text-xl font-bold text-white">Next Tale</span>
          </div>
          <button
            onClick={onGetStarted}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-100"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute -right-40 bottom-20 h-[500px] w-[500px] rounded-full bg-pink-600/20 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400">
                <Sparkles className="h-4 w-4 text-purple-400" />
                AI-Powered Content Creation
              </div>

              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Create{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                  anything
                </span>
                <br />
                with just words
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-gray-400 lg:text-xl">
                Games, stories, tools, quizzes — describe what you want and watch AI bring it to
                life. No coding required.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                <button
                  onClick={onGetStarted}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:shadow-lg hover:shadow-purple-500/25 sm:w-auto"
                >
                  Start Creating
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="text-sm text-gray-500">Free to start • No credit card</p>
              </div>
            </div>

            {/* Right: Content Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm">
                {/* Card */}
                <div
                  onClick={onGetStarted}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-2xl shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/50 hover:shadow-purple-500/20"
                >
                  {loading ? (
                    <div className="flex aspect-[3/4] items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                    </div>
                  ) : featuredContent ? (
                    <div className="relative">
                      {/* Image */}
                      <div className="relative aspect-[3/4] overflow-hidden">
                        {featuredContent.thumbnail_url ? (
                          <img
                            src={featuredContent.thumbnail_url}
                            alt={featuredContent.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-pink-900">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
                              {getContentTypeIcon(featuredContent.feed_type)}
                            </div>
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />

                        {/* Content type badge */}
                        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                          {getContentTypeIcon(featuredContent.feed_type)}
                          {getContentTypeLabel(featuredContent.feed_type)}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-5">
                        <h3 className="mb-2 text-xl font-bold text-white transition-colors group-hover:text-purple-300">
                          {featuredContent.title}
                        </h3>
                        {featuredContent.description && (
                          <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                            {featuredContent.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <Heart className="h-4 w-4 fill-pink-500 text-pink-500" />
                            <span>{featuredContent.likes_count}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white transition-all group-hover:shadow-lg group-hover:shadow-purple-500/25">
                            <Play className="h-4 w-4 fill-current" />
                            {featuredContent.feed_type === 'story' ? 'Read Now' : 'Try It'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] flex-col items-center justify-center p-6 text-center">
                      <Sparkles className="mb-4 h-12 w-12 text-purple-500" />
                      <p className="text-sm text-gray-500">Be the first to create!</p>
                    </div>
                  )}
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 -z-10 h-32 w-32 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 opacity-30 blur-2xl" />
                <div className="absolute -right-6 -top-6 -z-10 h-32 w-32 rounded-3xl bg-gradient-to-br from-pink-600 to-rose-600 opacity-30 blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="border-t border-gray-800/50 bg-gray-900/30 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: Gamepad2, label: 'Games', desc: 'Playable in browser' },
              { icon: BookOpen, label: 'Stories', desc: 'Interactive narratives' },
              { icon: Wrench, label: 'Tools', desc: 'Useful utilities' },
              { icon: Sparkles, label: 'More', desc: 'Quizzes, widgets...' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                  <item.icon className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="mb-1 font-semibold text-white">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to create?</h2>
          <p className="mb-8 text-gray-400">
            Join thousands of creators making games, stories, and tools with AI.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:shadow-lg hover:shadow-purple-500/25"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-gray-500 md:flex-row">
          <div className="flex items-center gap-2">
            <img src="/nexttale-logo.png" alt="" className="h-5 w-5" />
            <span>&copy; {new Date().getFullYear()} Next Tale</span>
          </div>
          <div className="flex gap-6">
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
