import { useState, useEffect, useCallback } from 'react';
import {
  getUserReaction,
  addReaction,
  updateReaction,
  removeReaction,
} from '../../../lib/storyService';
import type { StoryReaction } from '../../../lib/types';

interface UseStoryReactionsOptions {
  storyId: string;
  userId: string;
  initialLikesCount?: number;
  initialDislikesCount?: number;
}

interface UseStoryReactionsReturn {
  userReaction: StoryReaction | null;
  likesCount: number;
  dislikesCount: number;
  isLoading: boolean;
  handleReaction: (reaction: 'like' | 'dislike' | null) => Promise<void>;
}

export function useStoryReactions({
  storyId,
  userId,
  initialLikesCount = 0,
  initialDislikesCount = 0,
}: UseStoryReactionsOptions): UseStoryReactionsReturn {
  const [userReaction, setUserReaction] = useState<StoryReaction | null>(null);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [dislikesCount, setDislikesCount] = useState(initialDislikesCount);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial reaction data
  useEffect(() => {
    const loadReactionData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const reaction = await getUserReaction(userId, storyId);
        setUserReaction(reaction);
      } catch (error) {
        console.error('Error loading reaction:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReactionData();
  }, [storyId, userId]);

  // Update counts when initial values change
  useEffect(() => {
    setLikesCount(initialLikesCount);
    setDislikesCount(initialDislikesCount);
  }, [initialLikesCount, initialDislikesCount]);

  const handleReaction = useCallback(
    async (newReaction: 'like' | 'dislike' | null) => {
      if (!userId) return;

      try {
        const currentReaction = userReaction?.reaction_type;

        if (newReaction === null) {
          // Remove reaction
          await removeReaction(userId, storyId);
          setUserReaction(null);
          if (currentReaction === 'like') {
            setLikesCount((prev) => prev - 1);
          } else if (currentReaction === 'dislike') {
            setDislikesCount((prev) => prev - 1);
          }
        } else if (currentReaction) {
          // Update existing reaction
          await updateReaction(userId, storyId, newReaction);
          if (currentReaction === 'like' && newReaction === 'dislike') {
            setLikesCount((prev) => prev - 1);
            setDislikesCount((prev) => prev + 1);
          } else if (currentReaction === 'dislike' && newReaction === 'like') {
            setDislikesCount((prev) => prev - 1);
            setLikesCount((prev) => prev + 1);
          }
          setUserReaction({
            id: '',
            user_id: userId,
            story_id: storyId,
            reaction_type: newReaction,
            created_at: new Date().toISOString(),
          });
        } else {
          // Add new reaction
          await addReaction(userId, storyId, newReaction);
          if (newReaction === 'like') {
            setLikesCount((prev) => prev + 1);
          } else {
            setDislikesCount((prev) => prev + 1);
          }
          setUserReaction({
            id: '',
            user_id: userId,
            story_id: storyId,
            reaction_type: newReaction,
            created_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error handling reaction:', error);
      }
    },
    [userId, storyId, userReaction]
  );

  return {
    userReaction,
    likesCount,
    dislikesCount,
    isLoading,
    handleReaction,
  };
}
