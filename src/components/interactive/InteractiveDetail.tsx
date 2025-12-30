import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Play,
  Eye,
  Share2,
  MessageCircle,
  Trash2,
  User,
  Gamepad2,
  Wrench,
  LayoutGrid,
  HelpCircle,
  BarChart3,
  Pencil,
  X,
  Loader,
  Sparkles,
} from 'lucide-react';
import {
  getInteractiveContent,
  deleteInteractiveContent,
  getInteractiveReaction,
  addInteractiveReaction,
  updateInteractiveReaction,
  removeInteractiveReaction,
  getInteractiveShareUrl,
  trackInteractiveView,
  editInteractiveContentWithPrompt,
  updateInteractiveContent,
} from '../../lib/interactiveService';
import { supabase } from '../../lib/supabase';
import type {
  InteractiveContent,
  ContentType,
  InteractiveReaction,
} from '../../lib/interactiveTypes';
import { getSafeDisplayName } from '../../lib/displayName';
import { InteractiveCommentSection } from './InteractiveCommentSection';
import { InteractiveViewer } from './InteractiveViewer';

interface InteractiveDetailProps {
  contentId: string;
  userId: string;
  isPro?: boolean;
  onBack: () => void;
  onStart: () => void;
  onViewProfile?: (userId: string) => void;
}

const TYPE_CONFIG: Record<
  Exclude<ContentType, 'story'>,
  { icon: React.ReactNode; label: string; color: string; bgColor: string }
> = {
  game: {
    icon: <Gamepad2 className="h-5 w-5" />,
    label: 'Game',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  tool: {
    icon: <Wrench className="h-5 w-5" />,
    label: 'Tool',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  widget: {
    icon: <LayoutGrid className="h-5 w-5" />,
    label: 'Widget',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  quiz: {
    icon: <HelpCircle className="h-5 w-5" />,
    label: 'Quiz',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  visualization: {
    icon: <BarChart3 className="h-5 w-5" />,
    label: 'Visualization',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
  },
};

export function InteractiveDetail({
  contentId,
  userId,
  isPro: _isPro = false,
  onBack,
  onStart,
  onViewProfile,
}: InteractiveDetailProps) {
  const [content, setContent] = useState<InteractiveContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [reaction, setReaction] = useState<InteractiveReaction | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadContentDetails();
  }, [contentId]);

  const loadContentDetails = async () => {
    try {
      const contentData = await getInteractiveContent(contentId);
      if (!contentData) return;

      // If content is private and viewer isn't owner, block
      if (!contentData.is_public && contentData.created_by !== userId) {
        setContent(null);
      } else {
        setContent(contentData);
        // Record view
        if (userId) {
          trackInteractiveView(contentId, userId);
        }
      }

      setLikesCount(contentData.likes_count || 0);
      setDislikesCount(contentData.dislikes_count || 0);

      // Get comment count
      const { count: commentCount } = await supabase
        .from('interactive_comments')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', contentId);
      setCommentsCount(commentCount || 0);

      // Get user reaction
      if (userId) {
        const userReaction = await getInteractiveReaction(userId, contentId);
        setReaction(userReaction);
      }
    } catch (error) {
      console.error('Error loading content details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!userId) {
      alert('Please sign in to react');
      return;
    }

    try {
      if (reaction) {
        if (reaction.reaction_type === type) {
          await removeInteractiveReaction(userId, contentId);
          setReaction(null);
          if (type === 'like') setLikesCount((c) => c - 1);
          else setDislikesCount((c) => c - 1);
        } else {
          await updateInteractiveReaction(userId, contentId, type);
          setReaction({ ...reaction, reaction_type: type });
          if (type === 'like') {
            setLikesCount((c) => c + 1);
            setDislikesCount((c) => c - 1);
          } else {
            setDislikesCount((c) => c + 1);
            setLikesCount((c) => c - 1);
          }
        }
      } else {
        await addInteractiveReaction(userId, contentId, type);
        setReaction({
          id: '',
          user_id: userId,
          content_id: contentId,
          reaction_type: type,
          created_at: '',
        });
        if (type === 'like') setLikesCount((c) => c + 1);
        else setDislikesCount((c) => c + 1);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleShare = async () => {
    if (!content) return;
    const shareUrl = getInteractiveShareUrl(contentId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description,
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
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    setDeleting(true);
    try {
      await deleteInteractiveContent(contentId);
      onBack();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete. Please try again.');
      setDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !content?.html_content) return;

    setEditing(true);
    try {
      // Generate edited content
      const result = await editInteractiveContentWithPrompt(content.html_content, editPrompt);

      // Update in database
      await updateInteractiveContent(contentId, {
        html_content: result.html,
        title: result.title || content.title,
        description: result.description || content.description,
      });

      // Update local state
      setContent({
        ...content,
        html_content: result.html,
        title: result.title || content.title,
        description: result.description || content.description,
      });

      setShowEditModal(false);
      setEditPrompt('');
      setShowPreview(true); // Show preview after edit
    } catch (error) {
      console.error('Error editing content:', error);
      alert('Failed to edit content. Please try again.');
    } finally {
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-950">
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
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="mb-4 text-gray-300">Content not found or not available.</p>
          <p className="mb-6 text-sm text-gray-500">
            The content may be private or has been removed.
          </p>
          <button
            onClick={onBack}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:opacity-90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const typeConfig =
    TYPE_CONFIG[content.content_type as Exclude<ContentType, 'story'>] || TYPE_CONFIG.game;
  const isOwner = content.created_by === userId;

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-2xl">
          {/* Preview Section */}
          <div className="relative h-[70vh] max-h-[80vh] min-h-[320px] overflow-hidden bg-gray-800">
            {showPreview && content.html_content ? (
              <InteractiveViewer
                htmlContent={content.html_content}
                title={content.title}
                className="h-full w-full"
              />
            ) : content.thumbnail_url ? (
              <img
                src={content.thumbnail_url}
                alt={content.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
                <div className={`${typeConfig.color} opacity-30`}>{typeConfig.icon}</div>
              </div>
            )}

            {/* Preview toggle button */}
            {content.html_content && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="absolute bottom-4 right-4 rounded-lg bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            )}

            {/* Creator overlay */}
            {content.creator && (
              <button
                onClick={() => content.created_by && onViewProfile?.(content.created_by)}
                className="absolute left-3 top-3 flex cursor-pointer items-center gap-2 rounded-full bg-black/30 p-1.5 pr-3 backdrop-blur-sm transition-colors hover:bg-black/50"
              >
                {content.creator.avatar_url ? (
                  <img
                    src={content.creator.avatar_url}
                    alt={content.creator.display_name || 'Creator'}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-700">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <span className="text-sm font-medium text-white">
                  {getSafeDisplayName(content.creator.display_name, 'Anonymous')}
                </span>
              </button>
            )}

            {/* Type badge */}
            <div className="absolute right-3 top-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 ${typeConfig.bgColor} rounded-full backdrop-blur-sm`}
              >
                {typeConfig.icon}
                <span className={`${typeConfig.color} text-sm font-medium`}>
                  {typeConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="mb-6">
              <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">{content.title}</h1>
              <p className="text-xl leading-relaxed text-gray-400">{content.description}</p>
            </div>

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {content.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mb-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{content.estimated_duration} min</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Eye className="h-5 w-5" />
                <span className="font-medium">{content.view_count || 0} views</span>
              </div>
            </div>

            <div className="mb-8 flex items-center gap-4">
              <button
                onClick={() => handleReaction('like')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors ${
                  reaction?.reaction_type === 'like'
                    ? 'border border-green-500/50 bg-green-900/50 text-green-400'
                    : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-green-900/30 hover:text-green-400'
                }`}
              >
                <ThumbsUp
                  className={`h-5 w-5 ${reaction?.reaction_type === 'like' ? 'fill-current' : ''}`}
                />
                <span>{likesCount}</span>
              </button>
              <button
                onClick={() => handleReaction('dislike')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors ${
                  reaction?.reaction_type === 'dislike'
                    ? 'border border-red-500/50 bg-red-900/50 text-red-400'
                    : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-red-900/30 hover:text-red-400'
                }`}
              >
                <ThumbsDown
                  className={`h-5 w-5 ${reaction?.reaction_type === 'dislike' ? 'fill-current' : ''}`}
                />
                <span>{dislikesCount}</span>
              </button>
              <button
                onClick={() => {
                  setShowComments(!showComments);
                  if (!showComments) {
                    setTimeout(() => {
                      document
                        .getElementById('comment-section')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors ${
                  showComments
                    ? 'border border-purple-500/50 bg-purple-900/50 text-purple-400'
                    : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-purple-900/30 hover:text-purple-400'
                }`}
              >
                <MessageCircle className="h-5 w-5" />
                <span>{commentsCount}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 font-semibold text-gray-400 transition-colors hover:bg-purple-900/30 hover:text-purple-400"
              >
                <Share2 className="h-5 w-5" />
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 font-semibold text-blue-400 transition-colors hover:bg-blue-900/30"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 font-semibold text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <button
              onClick={onStart}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:opacity-90 hover:shadow-xl"
            >
              <Play className="h-6 w-6 fill-white" />
              {content.content_type === 'game' ? 'Play Now' : 'Try It Now'}
            </button>
          </div>
        </div>

        {showComments && (
          <div id="comment-section">
            <InteractiveCommentSection contentId={contentId} userId={userId} />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Edit with AI</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-400">
              Describe the changes you want to make. The AI will modify the content while keeping
              everything else intact.
            </p>

            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g., Change the colors to blue and green, add a restart button, make the text larger..."
              className="mb-4 h-32 w-full resize-none rounded-xl border border-gray-700 bg-gray-800 p-4 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={editing}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editing}
                className="flex-1 rounded-xl border border-gray-700 bg-gray-800 py-3 font-semibold text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editing || !editPrompt.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {editing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
