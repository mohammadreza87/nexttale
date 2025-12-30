import { supabase } from './supabase';
import type {
  Story,
  StoryNode,
  StoryChoice,
  StoryReaction,
  StoryOutline,
  StoryMemory,
} from './types';

export async function getStories(): Promise<Story[]> {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!stories) return [];

  const storiesWithCreators = await Promise.all(
    stories.map(async (story) => {
      const { data: creator } = story.created_by
        ? await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', story.created_by)
            .maybeSingle()
        : { data: null };

      // Get comment count
      const { count: commentCount } = await supabase
        .from('story_comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', story.id);

      // If no cover image, try to get the start node's image as fallback
      let coverImage = story.cover_image_url;
      if (!coverImage) {
        const { data: startNode } = await supabase
          .from('story_nodes')
          .select('image_url')
          .eq('story_id', story.id)
          .eq('node_key', 'start')
          .maybeSingle();

        if (startNode?.image_url) {
          coverImage = startNode.image_url;
        }
      }

      return { ...story, cover_image_url: coverImage, creator, comment_count: commentCount || 0 };
    })
  );

  return storiesWithCreators;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

export async function getStoriesPaginated(
  limit: number = 10,
  offset: number = 0
): Promise<PaginatedResult<Story>> {
  // First get total count
  const { count: total } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true });

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  if (!stories) return { data: [], hasMore: false, total: 0 };

  const storiesWithCreators = await Promise.all(
    stories.map(async (story) => {
      const { data: creator } = story.created_by
        ? await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', story.created_by)
            .maybeSingle()
        : { data: null };

      // Get comment count
      const { count: commentCount } = await supabase
        .from('story_comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', story.id);

      // If no cover image, try to get the start node's image as fallback
      let coverImage = story.cover_image_url;
      if (!coverImage) {
        const { data: startNode } = await supabase
          .from('story_nodes')
          .select('image_url')
          .eq('story_id', story.id)
          .eq('node_key', 'start')
          .maybeSingle();

        if (startNode?.image_url) {
          coverImage = startNode.image_url;
        }
      }

      return { ...story, cover_image_url: coverImage, creator, comment_count: commentCount || 0 };
    })
  );

  return {
    data: storiesWithCreators,
    hasMore: offset + limit < (total || 0),
    total: total || 0,
  };
}

export async function getUserStories(userId: string): Promise<Story[]> {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!stories) return [];

  const storiesWithCreators = await Promise.all(
    stories.map(async (story) => {
      const { data: creator } = story.created_by
        ? await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', story.created_by)
            .maybeSingle()
        : { data: null };

      // Get comment count
      const { count: commentCount } = await supabase
        .from('story_comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', story.id);

      // If no cover image, try to get the start node's image as fallback
      let coverImage = story.cover_image_url;
      if (!coverImage) {
        const { data: startNode } = await supabase
          .from('story_nodes')
          .select('image_url')
          .eq('story_id', story.id)
          .eq('node_key', 'start')
          .maybeSingle();

        if (startNode?.image_url) {
          coverImage = startNode.image_url;
        }
      }

      return { ...story, cover_image_url: coverImage, creator, comment_count: commentCount || 0 };
    })
  );

  return storiesWithCreators;
}

export async function getUserStoriesPaginated(
  userId: string,
  limit: number = 6,
  offset: number = 0
): Promise<PaginatedResult<Story>> {
  const { count: total } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId);

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  if (!stories) return { data: [], hasMore: false, total: 0 };

  const storiesWithCreators = await Promise.all(
    stories.map(async (story) => {
      const { data: creator } = story.created_by
        ? await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', story.created_by)
            .maybeSingle()
        : { data: null };

      let coverImage = story.cover_image_url;
      if (!coverImage) {
        const { data: startNode } = await supabase
          .from('story_nodes')
          .select('image_url')
          .eq('story_id', story.id)
          .eq('node_key', 'start')
          .maybeSingle();

        if (startNode?.image_url) {
          coverImage = startNode.image_url;
        }
      }

      return { ...story, cover_image_url: coverImage, creator };
    })
  );

  return {
    data: storiesWithCreators,
    hasMore: offset + limit < (total || 0),
    total: total || 0,
  };
}

export async function getPublicUserStories(userId: string): Promise<Story[]> {
  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('created_by', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!stories) return [];

  const storiesWithCreators = await Promise.all(
    stories.map(async (story) => {
      const { data: creator } = story.created_by
        ? await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', story.created_by)
            .maybeSingle()
        : { data: null };

      let coverImage = story.cover_image_url;
      if (!coverImage) {
        const { data: startNode } = await supabase
          .from('story_nodes')
          .select('image_url')
          .eq('story_id', story.id)
          .eq('node_key', 'start')
          .maybeSingle();

        if (startNode?.image_url) {
          coverImage = startNode.image_url;
        }
      }

      return { ...story, cover_image_url: coverImage, creator };
    })
  );

  return storiesWithCreators;
}

export async function getPublicUserStoriesPaginated(
  userId: string,
  limit: number = 6,
  offset: number = 0
): Promise<PaginatedResult<Story>> {
  const { count: total } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId)
    .eq('is_public', true);

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('created_by', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  if (!stories) return { data: [], hasMore: false, total: 0 };

  const storiesWithCreators = await Promise.all(
    stories.map(async (story) => {
      const { data: creator } = story.created_by
        ? await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', story.created_by)
            .maybeSingle()
        : { data: null };

      let coverImage = story.cover_image_url;
      if (!coverImage) {
        const { data: startNode } = await supabase
          .from('story_nodes')
          .select('image_url')
          .eq('story_id', story.id)
          .eq('node_key', 'start')
          .maybeSingle();

        if (startNode?.image_url) {
          coverImage = startNode.image_url;
        }
      }

      return { ...story, cover_image_url: coverImage, creator };
    })
  );

  return {
    data: storiesWithCreators,
    hasMore: offset + limit < (total || 0),
    total: total || 0,
  };
}

export async function deleteStory(storyId: string): Promise<void> {
  // First, get the story to check if it's failed and get the creator
  const { data: story } = await supabase
    .from('stories')
    .select('generation_status, created_by')
    .eq('id', storyId)
    .maybeSingle();

  // If story is failed, refund the credit to the creator
  if (story && story.generation_status === 'failed' && story.created_by) {
    const today = new Date().toISOString().split('T')[0];

    // Get current user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stories_generated_today, last_generation_date')
      .eq('id', story.created_by)
      .maybeSingle();

    // Only refund if the story was generated today
    const generatedToday = profile?.stories_generated_today ?? 0;
    if (profile && profile.last_generation_date === today && generatedToday > 0) {
      await supabase
        .from('user_profiles')
        .update({ stories_generated_today: generatedToday - 1 })
        .eq('id', story.created_by);
    }
  }

  // Delete the story
  const { error } = await supabase.from('stories').delete().eq('id', storyId);

  if (error) throw error;
}

export async function getStoryNode(storyId: string, nodeKey: string): Promise<StoryNode | null> {
  const { data, error } = await supabase
    .from('story_nodes')
    .select('*')
    .eq('story_id', storyId)
    .eq('node_key', nodeKey)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getNodeChoices(
  nodeId: string
): Promise<(StoryChoice & { to_node: StoryNode })[]> {
  const { data, error } = await supabase
    .from('story_choices')
    .select(
      `
      *,
      to_node:story_nodes!story_choices_to_node_id_fkey(*)
    `
    )
    .eq('from_node_id', nodeId)
    .order('choice_order');

  if (error) throw error;
  return data || [];
}

export async function saveProgress(
  userId: string,
  storyId: string,
  currentNodeId: string,
  pathTaken: string[],
  completed: boolean
) {
  if (!userId) return;

  const { data: existing } = await supabase
    .from('user_story_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .maybeSingle();

  const progressData = {
    user_id: userId,
    story_id: storyId,
    current_node_id: currentNodeId,
    path_taken: pathTaken,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from('user_story_progress')
      .update(progressData)
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_story_progress').insert({
      ...progressData,
      started_at: new Date().toISOString(),
    });

    if (error) throw error;
  }
}

export async function getProgress(userId: string, storyId: string) {
  const { data, error } = await supabase
    .from('user_story_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateStoryCoverImage(storyId: string, coverImageUrl: string) {
  const { error } = await supabase
    .from('stories')
    .update({ cover_image_url: coverImageUrl })
    .eq('id', storyId);

  if (error) throw error;
}

export async function updateNodeImage(nodeId: string, imageUrl: string, imagePrompt: string) {
  const { error } = await supabase
    .from('story_nodes')
    .update({
      image_url: imageUrl,
      image_prompt: imagePrompt,
    })
    .eq('id', nodeId);

  if (error) throw error;
}

export async function updateNodeAudio(nodeId: string, audioUrl: string | null) {
  const { error } = await supabase
    .from('story_nodes')
    .update({ audio_url: audioUrl })
    .eq('id', nodeId);

  if (error) throw error;
}

export async function createStoryNode(
  storyId: string,
  nodeKey: string,
  content: string,
  isEnding: boolean,
  endingType: string | null,
  orderIndex: number,
  parentChoiceId: string | null = null
): Promise<StoryNode> {
  const { data, error } = await supabase
    .from('story_nodes')
    .insert({
      story_id: storyId,
      node_key: nodeKey,
      content: content,
      is_ending: isEnding,
      ending_type: endingType,
      order_index: orderIndex,
      parent_choice_id: parentChoiceId,
      image_url: null,
      image_prompt: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createStoryChoice(
  fromNodeId: string,
  toNodeId: string,
  choiceText: string,
  consequenceHint: string | null,
  choiceOrder: number,
  _createdBy?: string
): Promise<StoryChoice> {
  // Build insert object
  const insertData = {
    from_node_id: fromNodeId,
    to_node_id: toNodeId,
    choice_text: choiceText,
    consequence_hint: consequenceHint,
    choice_order: choiceOrder,
  };

  const { data, error } = await supabase.from('story_choices').insert(insertData).select().single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create story choice');
  return data as unknown as StoryChoice;
}

export async function deleteStoryChoice(choiceId: string): Promise<void> {
  // Get the choice details first
  const { data: choice } = await supabase
    .from('story_choices')
    .select('to_node_id')
    .eq('id', choiceId)
    .single();

  if (!choice) {
    throw new Error('Choice not found');
  }

  // Find and delete any nodes that have this choice as parent
  const { data: childNodes } = await supabase
    .from('story_nodes')
    .select('id')
    .eq('parent_choice_id', choiceId);

  if (childNodes && childNodes.length > 0) {
    for (const node of childNodes) {
      // First delete any choices originating from this node
      const { data: nodeChoices } = await supabase
        .from('story_choices')
        .select('id')
        .eq('from_node_id', node.id);

      if (nodeChoices) {
        for (const nc of nodeChoices) {
          // Recursively delete child choices
          await deleteStoryChoice(nc.id);
        }
      }

      // Now delete the node itself
      await supabase.from('story_nodes').delete().eq('id', node.id);
    }
  }

  // Clear the parent_choice_id reference from any nodes pointing to this choice
  await supabase
    .from('story_nodes')
    .update({ parent_choice_id: null })
    .eq('parent_choice_id', choiceId);

  // Now delete the choice
  const { error } = await supabase.from('story_choices').delete().eq('id', choiceId);

  if (error) throw error;

  // Delete the target node if it's an empty placeholder
  if (choice.to_node_id) {
    const { data: targetNode } = await supabase
      .from('story_nodes')
      .select('content')
      .eq('id', choice.to_node_id)
      .single();

    if (targetNode && targetNode.content === '') {
      await supabase.from('story_nodes').delete().eq('id', choice.to_node_id);
    }
  }
}

export async function toggleChoiceVisibility(choiceId: string, isPublic: boolean): Promise<void> {
  // Note: is_public column may not exist on story_choices - this is a placeholder
  const { error } = await supabase
    .from('story_choices')
    .update({ is_public: isPublic } as Record<string, unknown>)
    .eq('id', choiceId);

  if (error) throw error;
}

export async function getStory(storyId: string): Promise<Story | null> {
  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .maybeSingle();

  if (error) throw error;
  if (!story) return null;

  const { data: creator } = story.created_by
    ? await supabase
        .from('user_profiles')
        .select('display_name, avatar_url')
        .eq('id', story.created_by)
        .maybeSingle()
    : { data: null };

  // If no cover image, try to get the start node's image as fallback
  let coverImage = story.cover_image_url;
  if (!coverImage) {
    const { data: startNode } = await supabase
      .from('story_nodes')
      .select('image_url')
      .eq('story_id', story.id)
      .eq('node_key', 'start')
      .maybeSingle();

    if (startNode?.image_url) {
      coverImage = startNode.image_url;
    }
  }

  return { ...story, cover_image_url: coverImage, creator } as Story;
}

export async function getUserReaction(
  userId: string,
  storyId: string
): Promise<StoryReaction | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('story_reactions')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function addReaction(
  userId: string,
  storyId: string,
  reactionType: 'like' | 'dislike'
): Promise<void> {
  if (!userId) return;

  const { error } = await supabase.from('story_reactions').insert({
    user_id: userId,
    story_id: storyId,
    reaction_type: reactionType,
  });

  if (error) throw error;
}

export async function updateReaction(
  userId: string,
  storyId: string,
  reactionType: 'like' | 'dislike'
): Promise<void> {
  if (!userId) return;

  const { error } = await supabase
    .from('story_reactions')
    .update({ reaction_type: reactionType })
    .eq('user_id', userId)
    .eq('story_id', storyId);

  if (error) throw error;
}

export async function removeReaction(userId: string, storyId: string): Promise<void> {
  if (!userId) return;

  const { error } = await supabase
    .from('story_reactions')
    .delete()
    .eq('user_id', userId)
    .eq('story_id', storyId);

  if (error) throw error;
}

export async function startStoryGeneration(storyId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('generation_queue').insert({
    story_id: storyId,
    user_id: userId,
    status: 'pending',
    priority: 0,
  });

  if (error) throw error;

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-story-queue`;
  const headers = {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    console.log('Triggering story generation for:', storyId);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ storyId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Story generation trigger failed:', response.status, errorData);
      throw new Error(
        `Failed to trigger story generation: ${errorData.error || response.statusText}`
      );
    }

    const result = await response.json();
    console.log('Story generation triggered successfully:', result);
  } catch (error) {
    console.error('Error starting story generation:', error);
    throw error;
  }
}

export async function getStoryGenerationStatus(storyId: string): Promise<{
  status: string;
  progress: number;
  nodesGenerated: number;
  totalNodesPlanned: number;
} | null> {
  const { data, error } = await supabase
    .from('stories')
    .select('generation_status, generation_progress, nodes_generated, total_nodes_planned')
    .eq('id', storyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    status: data.generation_status || 'pending',
    progress: data.generation_progress || 0,
    nodesGenerated: data.nodes_generated || 0,
    totalNodesPlanned: data.total_nodes_planned || 0,
  };
}

export async function updateStoryVisibility(storyId: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ is_public: isPublic })
    .eq('id', storyId);

  if (error) throw error;
}

export async function followUser(followingId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('user_follows').insert({
    follower_id: user.id,
    following_id: followingId,
  });

  if (error) throw error;
}

export async function unfollowUser(followingId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId);

  if (error) throw error;
}

export async function isFollowing(userId: string, followingId: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) throw error;
  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) throw error;
  return count || 0;
}

// ============================================
// Story Memory & Outline Functions
// ============================================

/**
 * Save story outline and initial memory after generation
 */
export async function saveStoryOutlineAndMemory(
  storyId: string,
  outline: StoryOutline,
  memory: StoryMemory
): Promise<void> {
  // Note: story_outline and story_memory columns may not exist - operation may fail silently
  const { error } = await supabase
    .from('stories')
    .update({
      story_outline: outline,
      story_memory: memory,
    } as Record<string, unknown>)
    .eq('id', storyId);

  if (error) {
    console.error('Error saving story outline and memory:', error);
    // Don't throw - columns may not exist yet
  }
}

/**
 * Update story memory after a chapter is generated
 * Note: story_memory column may not exist yet - operation may fail silently
 */
export async function updateStoryMemory(storyId: string, memory: StoryMemory): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .update({ story_memory: memory } as Record<string, unknown>)
    .eq('id', storyId);

  if (error) {
    console.error('Error updating story memory:', error);
    // Don't throw - column may not exist yet
  }
}

/**
 * Get story outline and memory
 * Note: story_outline/story_memory columns may not exist yet
 */
export async function getStoryContext(storyId: string): Promise<{
  outline: StoryOutline | null;
  memory: StoryMemory | null;
}> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .maybeSingle();

  if (error) {
    console.error('Error getting story context:', error);
    return { outline: null, memory: null };
  }

  // Cast to access potential story_outline/story_memory fields
  const storyData = data as unknown as {
    story_outline?: StoryOutline;
    story_memory?: StoryMemory;
  } | null;
  return {
    outline: storyData?.story_outline || null,
    memory: storyData?.story_memory || null,
  };
}

/**
 * Save chapter summary and character states to a node
 */
export async function saveChapterContext(
  nodeId: string,
  chapterSummary: string,
  characterStates?: Record<string, string>,
  imageContext?: Record<string, unknown>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    chapter_summary: chapterSummary,
  };

  if (characterStates) {
    updateData.character_states = characterStates;
  }

  if (imageContext) {
    updateData.image_context = imageContext;
  }

  const { error } = await supabase.from('story_nodes').update(updateData).eq('id', nodeId);

  if (error) throw error;
}
