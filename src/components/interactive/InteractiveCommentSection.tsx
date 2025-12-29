import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Trash2, Edit2 } from 'lucide-react';
import {
  getInteractiveComments,
  addInteractiveComment,
  deleteInteractiveComment,
  updateInteractiveComment,
} from '../../lib/interactiveService';
import type { InteractiveComment } from '../../lib/interactiveTypes';

interface InteractiveCommentSectionProps {
  contentId: string;
  userId?: string;
}

export function InteractiveCommentSection({ contentId, userId }: InteractiveCommentSectionProps) {
  const [comments, setComments] = useState<InteractiveComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInteractiveComments(contentId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) return;

    setSubmitting(true);
    try {
      const comment = await addInteractiveComment(userId, contentId, newComment);
      if (comment) {
        setComments([comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteInteractiveComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleEdit = (comment: InteractiveComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateInteractiveComment(commentId, editContent);
      setComments(comments.map((c) => (c.id === commentId ? { ...c, content: editContent } : c)));
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-white" />
        <h2 className="text-2xl font-bold text-white">Comments ({comments.length})</h2>
      </div>

      {userId ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full resize-none rounded-xl border-2 border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              rows={3}
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="absolute bottom-3 right-3 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-xl bg-gray-800 p-4 text-center">
          <p className="text-gray-400">Sign in to share your thoughts</p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="mx-auto mb-3 h-12 w-12 text-gray-600" />
            <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-800 pb-4 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    {comment.user_profile?.avatar_url ? (
                      <img
                        src={comment.user_profile.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-sm font-semibold text-white">
                        {comment.user_profile?.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        {comment.user_profile?.display_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                    </div>
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full resize-none rounded-lg border-2 border-gray-700 bg-gray-800 px-3 py-2 text-white transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        rows={3}
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleUpdate(comment.id)}
                          className="rounded-lg bg-purple-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-purple-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditContent('');
                          }}
                          className="rounded-lg bg-gray-700 px-3 py-1 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="ml-10 text-gray-300">{comment.content}</p>
                  )}
                </div>

                {userId === comment.user_id && editingId !== comment.id && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(comment)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-purple-500/10 hover:text-purple-400"
                      title="Edit comment"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
