import { BookOpen, Clock, Star, ArrowRight } from 'lucide-react';
import type { Story } from '../../../lib/types';

interface FeaturedStoriesSectionProps {
  stories: Story[];
  isLoading: boolean;
  onSelectStory: (storyId: string) => void;
  onGetStarted: () => void;
}

export function FeaturedStoriesSection({
  stories,
  isLoading,
  onSelectStory,
  onGetStarted,
}: FeaturedStoriesSectionProps) {
  return (
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

        {isLoading ? (
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
        ) : stories.length > 0 ? (
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            {stories.map((story) => (
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
  );
}
