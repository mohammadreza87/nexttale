import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, ThumbsUp, ThumbsDown, Play, Loader, Users, Eye, Share2, MessageCircle, Trash2, RefreshCw, User } from 'lucide-react';
import { getStory, deleteStory, startStoryGeneration } from '../lib/storyService';
import { supabase, getShareUrl } from '../lib/supabase';
import type { Story } from '../lib/types';
import { getSafeDisplayName } from '../lib/displayName';
import { CommentSection } from './CommentSection';
import { trackStoryView, trackStoryStart, trackReaction } from '../lib/analytics';

interface StoryDetailProps {
  storyId: string;
  userId: string;
  onBack: () => void;
  onStartStory: () => void;
  onViewProfile?: (userId: string) => void;
  isPro?: boolean;
}

export function StoryDetail({ storyId, userId, onBack, onStartStory, onViewProfile, isPro = false }: StoryDetailProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [hasContent, setHasContent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    loadStoryDetails();

    const channel = supabase
      .channel('story_generation_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stories',
        filter: `id=eq.${storyId}`
      }, (payload) => {
        console.log('Story updated:', payload);
        if (payload.new) {
          setStory(prev => prev ? { ...prev, ...payload.new } : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId]);

  useEffect(() => {
    if (!story || !story.generation_status || story.generation_status === 'fully_generated' || hasContent) {
      return;
    }

    const pollInterval = setInterval(() => {
      console.log('Polling for generation status update...');
      loadStoryDetails();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [story?.generation_status, hasContent]);

  const loadStoryDetails = async () => {
    try {
      const storyData = await getStory(storyId);
      if (!storyData) return;

      // If story is private and the viewer isn't the owner, block with a friendly message
      if (storyData && storyData.is_public === false && storyData.created_by !== userId) {
        setStory(null);
      } else {
        setStory(storyData);
        // Track story view
        trackStoryView(storyData.id, storyData.title, storyData.created_by);
      }
      setLikesCount(storyData.likes_count || 0);
      setDislikesCount(storyData.dislikes_count || 0);

      // Get comment count
      const { count: commentCount } = await supabase
        .from('story_comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId);
      setCommentsCount(commentCount || 0);

      // Check if story has actual content (nodes)
      const { data: nodes } = await supabase
        .from('story_nodes')
        .select('id')
        .eq('story_id', storyId)
        .limit(1);

      setHasContent((nodes && nodes.length > 0) || false);

      if (userId) {
        const { data: reaction } = await supabase
          .from('story_reactions')
          .select('reaction_type')
          .eq('user_id', userId)
          .eq('story_id', storyId)
          .maybeSingle();

        if (reaction) {
          setHasLiked(reaction.reaction_type === 'like');
          setHasDisliked(reaction.reaction_type === 'dislike');
        }
      }
    } catch (error) {
      console.error('Error loading story details:', error);
    } finally {
      setLoading(false);
    }
  };

  const isWaitingGeneration = story?.generation_status && story.generation_status !== 'fully_generated' && story.generation_status !== 'failed' && !hasContent;
  const hasFailed = story?.generation_status === 'failed';

  if (!loading && story && hasFailed) {
    const isOwner = story.created_by === userId;

    const handleDeleteFailedStory = async () => {
      if (!confirm('Are you sure you want to delete this failed story?')) return;
      setDeleting(true);
      try {
        await deleteStory(storyId);
        onBack();
      } catch (error) {
        console.error('Error deleting story:', error);
        alert('Failed to delete story. Please try again.');
        setDeleting(false);
      }
    };

    const handleRetryGeneration = async () => {
      setRetrying(true);
      try {
        // Clear any existing queue entry for this story
        await supabase
          .from('generation_queue')
          .delete()
          .eq('story_id', storyId);

        // Re-trigger the generation
        await startStoryGeneration(storyId, userId);

        // Only update status if generation started successfully
        await supabase
          .from('stories')
          .update({ generation_status: 'pending', generation_progress: 0 })
          .eq('id', storyId);

        // Reload the page to show generating state
        loadStoryDetails();
      } catch (error: unknown) {
        console.error('Error retrying story generation:', error);

        // Make sure status stays as failed
        await supabase
          .from('stories')
          .update({ generation_status: 'failed' })
          .eq('id', storyId);

        // Check if it's a "not properly initialized" error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not properly initialized') || errorMessage.includes('Start node not found')) {
          alert('This story cannot be retried because it was not properly created. Please delete it and create a new story.');
        } else {
          alert('Failed to retry generation. Please try again.');
        }
        setRetrying(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-white font-semibold mb-2">Story Generation Failed</p>
          <p className="text-gray-400 text-sm mb-6">This story couldn't be generated. You can retry or delete it.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleRetryGeneration}
              disabled={retrying || deleting}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {retrying ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              Retry
            </button>
            {isOwner && (
              <button
                onClick={handleDeleteFailedStory}
                disabled={deleting || retrying}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!loading && story && isWaitingGeneration) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Loader className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">Story is still generating</p>
          <p className="text-gray-400 text-sm mb-6">Please check back in a moment. We're creating the chapters and images.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  };

  const handleReaction = async (isLike: boolean) => {
    if (!userId) {
      alert('Please sign in to react to stories');
      return;
    }

    // Track reaction
    trackReaction(storyId, isLike ? 'like' : 'dislike');

    try {
      const reactionType = isLike ? 'like' : 'dislike';
      const { data: existing } = await supabase
        .from('story_reactions')
        .select('id, reaction_type')
        .eq('user_id', userId)
        .eq('story_id', storyId)
        .maybeSingle();

      if (existing) {
        if (existing.reaction_type === reactionType) {
          await supabase
            .from('story_reactions')
            .delete()
            .eq('id', existing.id);

          if (isLike) {
            setHasLiked(false);
            setLikesCount(prev => prev - 1);
          } else {
            setHasDisliked(false);
            setDislikesCount(prev => prev - 1);
          }
        } else {
          await supabase
            .from('story_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existing.id);

          if (isLike) {
            setHasLiked(true);
            setHasDisliked(false);
            setLikesCount(prev => prev + 1);
            setDislikesCount(prev => prev - 1);
          } else {
            setHasLiked(false);
            setHasDisliked(true);
            setLikesCount(prev => prev - 1);
            setDislikesCount(prev => prev + 1);
          }
        }
      } else {
        await supabase
          .from('story_reactions')
          .insert({
            user_id: userId,
            story_id: storyId,
            reaction_type: reactionType
          });

        if (isLike) {
          setHasLiked(true);
          setLikesCount(prev => prev + 1);
        } else {
          setHasDisliked(true);
          setDislikesCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 mb-4">Story not found or not available.</p>
          <p className="text-gray-500 text-sm mb-6">If you followed a link, the story may be private or still generating.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
          {(story.cover_image_url || story.cover_video_url) && (
            <div className="h-64 md:h-96 overflow-hidden relative">
              {story.cover_video_url ? (
                <video
                  src={story.cover_video_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={story.cover_image_url || undefined}
                />
              ) : (
                <img
                  src={story.cover_image_url!}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Creator overlay */}
              {story.creator && (
                <button
                  onClick={() => story.created_by && onViewProfile?.(story.created_by)}
                  className="absolute top-3 left-3 flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full p-1.5 pr-3 hover:bg-black/50 transition-colors cursor-pointer"
                >
                  {story.creator.avatar_url ? (
                    <img
                      src={story.creator.avatar_url}
                      alt={story.creator.display_name || 'Creator'}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <span className="text-white text-sm font-medium">
                    {getSafeDisplayName(story.creator.display_name, 'Anonymous')}
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="p-8 md:p-12">
            <div className="mb-6">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {story.title}
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                {story.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{story.estimated_duration} min read</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-5 h-5" />
                <span className="font-medium">Ages {story.age_range}</span>
              </div>
              <div className={`flex items-center gap-2 ${
                story.completion_count && story.completion_count > 0
                  ? 'text-green-500'
                  : 'text-gray-500'
              }`}>
                <Eye className="w-5 h-5" />
                <span className="font-medium">
                  {story.completion_count || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => handleReaction(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                  hasLiked
                    ? 'bg-green-900/50 text-green-400 border border-green-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-green-900/30 hover:text-green-400 border border-gray-700'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>
              <button
                onClick={() => handleReaction(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                  hasDisliked
                    ? 'bg-red-900/50 text-red-400 border border-red-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-red-900/30 hover:text-red-400 border border-gray-700'
                }`}
              >
                <ThumbsDown className={`w-5 h-5 ${hasDisliked ? 'fill-current' : ''}`} />
                <span>{dislikesCount}</span>
              </button>
              <button
                onClick={() => {
                  setShowComments(!showComments);
                  if (!showComments) {
                    setTimeout(() => {
                      document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${showComments ? 'bg-purple-900/50 text-purple-400 border border-purple-500/50' : 'bg-gray-800 text-gray-400 hover:bg-purple-900/30 hover:text-purple-400 border border-gray-700'}`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>{commentsCount}</span>
              </button>
              <button
                onClick={async () => {
                  const shareUrl = getShareUrl(storyId);
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: story.title,
                        text: `Check out this interactive story: ${story.title}`,
                        url: shareUrl,
                      });
                    } catch (error) {
                      if ((error as Error).name !== 'AbortError') {
                        console.error('Error sharing:', error);
                      }
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      alert('Link copied to clipboard!');
                    } catch (error) {
                      console.error('Error copying to clipboard:', error);
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors bg-gray-800 text-gray-400 hover:bg-purple-900/30 hover:text-purple-400 border border-gray-700"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                trackStoryStart(storyId, story.title);
                onStartStory();
              }}
              className="w-full py-4 text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            >
              <Play className="w-6 h-6 fill-white" />
              Start Adventure
            </button>
          </div>
        </div>

        {showComments && (
          <div id="comment-section">
            <CommentSection storyId={storyId} />
          </div>
        )}
      </div>
    </div>
  );
}
