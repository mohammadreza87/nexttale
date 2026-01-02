import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useVoiceInput, matchVoiceToChoice } from '../hooks/useVoiceInput';
import UpgradeModal from './UpgradeModal';
import {
  getStoryNode,
  getNodeChoices,
  saveProgress,
  updateNodeImage,
  createStoryNode,
  createStoryChoice,
  deleteStoryChoice,
  toggleChoiceVisibility,
  getStory,
  getStoryGenerationStatus,
} from '../lib/storyService';
import { trackChapterRead, trackStoryCompletion } from '../lib/pointsService';
import { supabase } from '../lib/supabase';
import { getSubscriptionUsage } from '../lib/subscriptionService';
import type { StoryNode, StoryChoice, Story } from '../lib/types';
import { getAutoNarration } from '../lib/settingsService';
import {
  CreatorCard,
  StoryActions,
  StoryHeader,
  ErrorAlert,
  LoadingChapter,
  ChapterCard,
  ChoiceSelector,
  useStoryReactions,
  useAudioNarration,
} from '../features/story-reader';

interface StoryReaderProps {
  storyId: string;
  userId: string;
  onComplete: () => void;
  onViewProfile?: (userId: string) => void;
}

interface StoryChapter {
  node: StoryNode;
  choices: (StoryChoice & { to_node: StoryNode })[];
  selectedChoiceId?: string;
  imageUrl?: string | null;
  generatingImage?: boolean;
  videoUrl?: string | null;
  generatingVideo?: boolean;
}

export function StoryReader({ storyId, userId, onComplete, onViewProfile }: StoryReaderProps) {
  const [chapters, setChapters] = useState<StoryChapter[]>([]);
  const [pathTaken, setPathTaken] = useState<string[]>(['start']);
  const [_isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<Story | null>(null);
  const [imageStyleReference, setImageStyleReference] = useState<string | null>(null);
  const [_generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [storyLikes, setStoryLikes] = useState(0);
  const [storyDislikes, setStoryDislikes] = useState(0);
  const latestChapterRef = useRef<HTMLDivElement | null>(null);
  const imageGenerationInProgress = useRef<Set<string>>(new Set());
  const videoGenerationInProgress = useRef<Set<string>>(new Set());
  const [autoNarrationEnabled, setAutoNarrationEnabled] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [hasVideoClips, setHasVideoClips] = useState(false);
  const [hasEditMode, setHasEditMode] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editingChoices, setEditingChoices] = useState<
    Array<{ id: string; text: string; hint?: string | null }>
  >([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [voiceInputChapterIndex, setVoiceInputChapterIndex] = useState<number | null>(null);
  const [voiceMatchedChoice, setVoiceMatchedChoice] = useState<string | null>(null);

  // Story reactions hook
  const {
    userReaction,
    likesCount,
    dislikesCount,
    handleReaction,
  } = useStoryReactions({
    storyId,
    userId,
    initialLikesCount: storyLikes,
    initialDislikesCount: storyDislikes,
  });

  // Audio narration hook
  const {
    isSpeaking,
    currentWordIndex,
    playingChapterId,
    audioLoadingChapters,
    toggleSpeech,
    stopSpeech,
    resetAutoPlay,
    error: audioError,
    clearError: clearAudioError,
  } = useAudioNarration({
    narratorEnabled: story?.narrator_enabled ?? false,
    autoNarrationEnabled,
    chapters: chapters.map((ch) => ({
      node: {
        id: ch.node.id,
        node_key: ch.node.node_key,
        content: ch.node.content,
        audio_url: ch.node.audio_url ?? null,
      },
    })),
  });

  // Local error state for non-audio errors (editing, etc.)
  const [error, setError] = useState<string | null>(null);

  // Voice input for choosing story paths
  const handleVoiceResult = useCallback(
    (transcript: string) => {
      if (voiceInputChapterIndex === null) return;

      const chapter = chapters[voiceInputChapterIndex];
      if (!chapter || chapter.selectedChoiceId) return;

      const availableChoices = chapter.choices
        .filter((c) => c.created_by === userId || c.is_public !== false)
        .map((c) => ({ id: c.id, text: c.choice_text }));

      const matched = matchVoiceToChoice(transcript, availableChoices);

      if (matched) {
        setVoiceMatchedChoice(matched.id);
        // Auto-select after a brief delay to show the match
        setTimeout(() => {
          const choice = chapter.choices.find((c) => c.id === matched.id);
          if (choice) {
            handleChoice(voiceInputChapterIndex, choice);
          }
          setVoiceInputChapterIndex(null);
          setVoiceMatchedChoice(null);
        }, 1000);
      }
    },
    [voiceInputChapterIndex, chapters, userId]
  );

  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript: voiceTranscript,
    startListening,
    stopListening,
  } = useVoiceInput({
    onResult: handleVoiceResult,
    language: story?.language === 'fa' ? 'fa-IR' : story?.language === 'tr' ? 'tr-TR' : 'en-US',
  });

  const toggleVoiceInput = (chapterIndex: number) => {
    // Voice input requires Pro or Max plan
    if (!hasVoiceInput) {
      setShowUpgradeModal(true);
      return;
    }

    if (isListening) {
      stopListening();
      setVoiceInputChapterIndex(null);
    } else {
      setVoiceInputChapterIndex(chapterIndex);
      startListening();
    }
  };

  useEffect(() => {
    initializeStory();
    checkUserPermissions();
    setAutoNarrationEnabled(getAutoNarration());
  }, [storyId, userId]);

  const checkUserPermissions = async () => {
    try {
      const usage = await getSubscriptionUsage(userId);
      setIsPro(usage.isPro);
      setHasVoiceInput(usage.hasVoiceInput);
      setHasVideoClips(usage.hasVideoClips);
      setHasEditMode(usage.hasEditMode);

      const storyData = await getStory(storyId);
      setIsOwner(storyData?.created_by === userId);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  useEffect(() => {
    if (!storyId) return;

    const checkGenerationProgress = async () => {
      const status = await getStoryGenerationStatus(storyId);
      if (status) {
        setGenerationProgress(status.progress);
        setGenerationStatus(status.status);
      }
    };

    checkGenerationProgress();

    const interval = setInterval(checkGenerationProgress, 3000);

    return () => clearInterval(interval);
  }, [storyId]);

  // When backend finishes generation, fill any missing images once
  useEffect(() => {
    if (generationStatus === 'fully_generated' && story) {
      const missing = chapters.filter((ch) => !ch.imageUrl && ch.node.id !== 'loading');
      missing.forEach((chapter) => {
        startImageGeneration(
          chapter.node.id,
          chapter.node.content,
          {
            storyTitle: story.title,
            artStyle: story.art_style,
            storyDescription: story.description ?? undefined,
            styleReference: imageStyleReference,
          },
          async (imageUrl) => {
            await updateNodeImage(
              chapter.node.id,
              imageUrl,
              chapter.node.content.substring(0, 200)
            );
            if (chapter.node.node_key === 'start') {
              await supabase
                .from('stories')
                .update({ cover_image_url: imageUrl })
                .eq('id', storyId);
              setStory((prev) => (prev ? { ...prev, cover_image_url: imageUrl } : prev));
            }
          }
        );
      });
    }
  }, [generationStatus, story, chapters]);

  const initializeStory = async () => {
    try {
      const storyData = await getStory(storyId);
      if (!storyData) return;
      setStory(storyData);
      setStoryLikes(storyData.likes_count || 0);
      setStoryDislikes(storyData.dislikes_count || 0);

      if (storyData.image_prompt) {
        setImageStyleReference(storyData.image_prompt);
      }

      loadStoryNode('start', undefined, storyData);
    } catch (error) {
      console.error('Error initializing story:', error);
      setLoading(false);
    }
  };

  const lastScrolledChapterRef = useRef<string | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  const scrollToElement = (element: HTMLElement) => {
    // Get the actual height of the sticky header dynamically
    const headerHeight = stickyHeaderRef.current?.offsetHeight || 200;
    const padding = 20; // Extra padding

    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerHeight - padding;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (latestChapterRef.current && chapters.length > 1) {
      const latestChapter = chapters[chapters.length - 1];
      // Only scroll when we have a real chapter (not loading placeholder) and haven't scrolled to it yet
      if (
        latestChapter.node.id !== 'loading' &&
        latestChapter.node.node_key !== 'loading' &&
        lastScrolledChapterRef.current !== latestChapter.node.id
      ) {
        lastScrolledChapterRef.current = latestChapter.node.id;
        scrollToElement(latestChapterRef.current);
      }
    }
  }, [chapters]);

  const generateUniqueNodeKey = (): string => {
    return `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const generateNodeImage = async (
    nodeContent: string,
    options: {
      storyTitle: string;
      artStyle?: string | null;
      storyDescription?: string;
      styleReference?: string | null;
      storyId?: string;
      nodeId?: string;
      previousPrompt?: string | null;
    }
  ): Promise<string | null> => {
    try {
      if (!nodeContent || !options.storyTitle) {
        console.error('Missing content or title for image generation');
        return null;
      }

      const {
        storyTitle,
        artStyle,
        storyDescription,
        styleReference,
        storyId: imgStoryId,
        nodeId,
        previousPrompt,
      } = options;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      console.log('Generating image for story chapter...');

      // Prefer user session token; fall back to anon key so images still generate for signed-out readers
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!accessToken) {
        console.error('Not authenticated for image generation');
        return null;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: nodeContent,
          styleReference: styleReference ?? imageStyleReference,
          artStyle: artStyle || story?.art_style || 'fantasy',
          storyTitle,
          storyDescription: storyDescription ?? (story?.description || ''),
          storyId: imgStoryId || story?.id || storyId,
          nodeId,
          previousPrompt: previousPrompt ?? imageStyleReference ?? null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        // Silently fail for billing issues - images are optional
        if (response.status === 400 || response.status === 429) {
          console.warn('Image generation unavailable (billing inactive)');
          return null;
        }
        console.error('Failed to generate node image:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error generating node image:', error);
      return null;
    }
  };

  const startImageGeneration = (
    nodeId: string,
    nodeContent: string,
    options: {
      storyTitle: string;
      artStyle?: string | null;
      storyDescription?: string;
      styleReference?: string | null;
      storyId?: string;
      previousPrompt?: string | null;
    },
    onSuccess?: (imageUrl: string) => Promise<void>
  ) => {
    if (!nodeContent || !options.storyTitle) return;
    if (imageGenerationInProgress.current.has(nodeId)) return;

    imageGenerationInProgress.current.add(nodeId);

    setChapters((prev) =>
      prev.map((ch) => (ch.node.id === nodeId ? { ...ch, generatingImage: true } : ch))
    );

    generateNodeImage(nodeContent, options)
      .then(async (imageUrl) => {
        if (imageUrl) {
          if (onSuccess) {
            await onSuccess(imageUrl);
          }
          setChapters((prev) =>
            prev.map((ch) => (ch.node.id === nodeId ? { ...ch, imageUrl } : ch))
          );
        }
      })
      .catch((err) => {
        console.log('Image generation failed, continuing without image:', err);
      })
      .finally(() => {
        imageGenerationInProgress.current.delete(nodeId);
        setChapters((prev) =>
          prev.map((ch) => (ch.node.id === nodeId ? { ...ch, generatingImage: false } : ch))
        );
      });
  };

  const generateVideoFromImage = async (
    imageUrl: string,
    nodeId: string,
    prompt?: string
  ): Promise<string | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!accessToken) {
        console.error('Not authenticated for video generation');
        return null;
      }

      console.log('Generating video for node:', nodeId);

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt || 'Subtle cinematic movement, gentle camera pan, atmospheric lighting',
          storyId,
          nodeId,
          resolution: '480',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to generate video:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      return data.videoUrl;
    } catch (error) {
      console.error('Error generating video:', error);
      return null;
    }
  };

  const startVideoGeneration = (
    nodeId: string,
    imageUrl: string,
    prompt?: string,
    onSuccess?: (videoUrl: string) => Promise<void>
  ) => {
    if (!imageUrl) return;
    if (videoGenerationInProgress.current.has(nodeId)) return;

    videoGenerationInProgress.current.add(nodeId);

    setChapters((prev) =>
      prev.map((ch) => (ch.node.id === nodeId ? { ...ch, generatingVideo: true } : ch))
    );

    generateVideoFromImage(imageUrl, nodeId, prompt)
      .then(async (videoUrl) => {
        if (videoUrl) {
          if (onSuccess) {
            await onSuccess(videoUrl);
          }
          setChapters((prev) =>
            prev.map((ch) => (ch.node.id === nodeId ? { ...ch, videoUrl } : ch))
          );
        }
      })
      .catch((err) => {
        console.log('Video generation failed, continuing without video:', err);
      })
      .finally(() => {
        videoGenerationInProgress.current.delete(nodeId);
        setChapters((prev) =>
          prev.map((ch) => (ch.node.id === nodeId ? { ...ch, generatingVideo: false } : ch))
        );
      });
  };

  const generateStory = async (
    storyContext: string,
    userChoice?: string,
    previousContent?: string
  ): Promise<any> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const realChapterCount = chapters.filter(
        (ch) => ch.node.id !== 'loading' && ch.node.node_key !== 'loading'
      ).length;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          storyContext,
          userChoice,
          previousContent,
          storyTitle: story?.title,
          chapterCount: realChapterCount,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Generate story error:', errorData);
        throw new Error(errorData.error || 'Failed to generate story');
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Story generation timed out. Please try again.');
      }
      console.error('Error generating story:', error);
      throw error;
    }
  };

  const waitForNodeResolution = async (
    nodeId: string,
    timeoutMs: number = 12000,
    intervalMs: number = 1500
  ) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data: node } = await supabase
        .from('story_nodes')
        .select('*')
        .eq('id', nodeId)
        .maybeSingle();

      if (node && node.content && !(node as any).is_placeholder) {
        return node as StoryNode;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return null;
  };

  const loadStoryNode = async (
    nodeKey: string,
    _previousContent?: string,
    storyOverride?: Story
  ) => {
    const currentStory = storyOverride || story;
    try {
      setLoading(true);
      let node = await getStoryNode(storyId, nodeKey);

      if (!node && currentStory?.story_context) {
        setIsGenerating(true);
        const generatedStory = await generateStory(currentStory.story_context);

        node = await createStoryNode(
          storyId,
          nodeKey,
          generatedStory.content,
          generatedStory.isEnding,
          generatedStory.endingType,
          0,
          null
        );

        if (!generatedStory.choices || generatedStory.choices.length === 0) {
          console.error('AI returned no choices for initial story:', generatedStory);
          throw new Error('Story generation failed: No choices provided');
        }

        const placeholderChoices = [];
        for (let i = 0; i < generatedStory.choices.length; i++) {
          const choice = generatedStory.choices[i];
          const placeholderNode = await createStoryNode(
            storyId,
            `${generateUniqueNodeKey()}_placeholder`,
            '',
            false,
            null,
            i + 1,
            null
          );

          const createdChoice = await createStoryChoice(
            node.id,
            placeholderNode.id,
            choice.text,
            choice.hint,
            i
          );
          placeholderChoices.push({ ...createdChoice, to_node: placeholderNode });
        }

        setIsGenerating(false);

        const chapter: StoryChapter = {
          node,
          choices: placeholderChoices,
          imageUrl: currentStory.cover_image_url,
          generatingImage: false,
        };

        setChapters([chapter]);
        setLoading(false);
        return;
      }

      if (!node) {
        setLoading(false);
        return;
      }

      const nodeChoices = node.is_ending ? [] : await getNodeChoices(node.id);
      console.log('Loaded node choices:', nodeChoices.length, 'choices for node:', node.id);
      console.log('Node is_ending:', node.is_ending);
      console.log('Choices details:', nodeChoices);

      if (!imageStyleReference && node.image_prompt) {
        setImageStyleReference(node.image_prompt);
      }

      const isFirstChapter = nodeKey === 'start';
      const shouldUseCoverImage = isFirstChapter && currentStory?.cover_image_url;
      const existingNodeImage = node.image_url;

      const chapter: StoryChapter = {
        node,
        choices: nodeChoices,
        imageUrl: shouldUseCoverImage ? currentStory.cover_image_url : existingNodeImage,
        generatingImage: false, // Don't show loading state, just show content immediately
      };

      console.log('Setting chapter with choices:', chapter.choices.length);
      setChapters([chapter]);

      // Ensure cover uses the first chapter's image when available
      if (isFirstChapter && currentStory && !currentStory.cover_image_url && existingNodeImage) {
        await supabase
          .from('stories')
          .update({ cover_image_url: existingNodeImage })
          .eq('id', storyId);

        setStory((prev) => (prev ? { ...prev, cover_image_url: existingNodeImage } : prev));
      }

      await trackChapterRead(userId, storyId, node.id, currentStory?.created_by || null);

      // Generate images in background without blocking text display
      // Generate images even if story is still generating - don't wait for full completion
      if (!shouldUseCoverImage && !existingNodeImage && currentStory) {
        console.log('No cached image for start node, generating new image in background');
        // Fire and forget - don't await
        startImageGeneration(
          node.id,
          node.content,
          {
            storyTitle: currentStory.title,
            artStyle: currentStory.art_style,
            storyDescription: currentStory.description ?? undefined,
            styleReference: imageStyleReference || (node.image_prompt ?? undefined),
            storyId,
            previousPrompt: (node.image_prompt ?? undefined) || imageStyleReference,
          },
          async (imageUrl) => {
            await updateNodeImage(node.id, imageUrl, node.content.substring(0, 200));
            // Also set as cover image if story doesn't have one
            if (!currentStory.cover_image_url) {
              await supabase
                .from('stories')
                .update({ cover_image_url: imageUrl })
                .eq('id', storyId);
            }
          }
        );
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading story node:', error);
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleChoice = async (
    chapterIndex: number,
    choice: StoryChoice & { to_node: StoryNode }
  ) => {
    const updatedChapters = [...chapters];
    updatedChapters[chapterIndex].selectedChoiceId = choice.id;
    setChapters(updatedChapters);

    setStoryError(null);
    stopSpeech();

    // Removed artificial delay for faster response

    const currentNode = updatedChapters[chapterIndex].node;
    const isPlaceholder = !choice.to_node.content;

    if (isPlaceholder && story?.story_context) {
      const loadingChapter: StoryChapter = {
        node: {
          id: 'loading',
          story_id: storyId,
          node_key: 'loading',
          content: '✨ Generating your story...',
          is_ending: false,
          ending_type: null,
          sequence_order: updatedChapters.length,
          parent_choice_id: null,
          image_url: null,
          image_prompt: null,
          audio_url: null,
          created_at: new Date().toISOString(),
        },
        choices: [],
        imageUrl: null,
        generatingImage: false,
      };

      const baseChapters = [...updatedChapters];
      setChapters([...baseChapters, loadingChapter]);

      try {
        setIsGenerating(true);

        // First, wait briefly for the backend worker to fill this placeholder
        const resolvedNode = await waitForNodeResolution(choice.to_node.id);

        if (resolvedNode) {
          const isEnding = resolvedNode.is_ending ?? false;
          const nextChoices = isEnding ? [] : await getNodeChoices(resolvedNode.id);
          const newPath = [...pathTaken, resolvedNode.node_key];
          setPathTaken(newPath);

          await saveProgress(userId, storyId, resolvedNode.id, newPath, isEnding);

          const newChapter: StoryChapter = {
            node: resolvedNode,
            choices: nextChoices,
            imageUrl: resolvedNode.image_url,
            generatingImage: false,
          };

          setChapters([...baseChapters, newChapter]);
          setIsGenerating(false);

          await trackChapterRead(userId, storyId, resolvedNode.id, story.created_by || null);
          if (resolvedNode.is_ending) {
            await trackStoryCompletion(userId, storyId, story.created_by || null);
          }

          // If backend didn't attach an image, generate it now in the background
          if (story && !resolvedNode.image_url) {
            startImageGeneration(
              resolvedNode.id,
              resolvedNode.content,
              {
                storyTitle: story.title,
                artStyle: story.art_style,
                storyDescription: story.description ?? undefined,
                styleReference: imageStyleReference || resolvedNode.image_prompt,
                storyId,
                previousPrompt: resolvedNode.image_prompt || imageStyleReference,
              },
              async (imageUrl) => {
                await updateNodeImage(
                  resolvedNode.id,
                  imageUrl,
                  resolvedNode.content.substring(0, 200)
                );
              }
            );
          }

          return;
        }

        // Fallback: generate content immediately after wait timeout
        const generatedStory = await generateStory(
          story.story_context,
          choice.choice_text,
          currentNode.content
        );

        const newNodeKey = generateUniqueNodeKey();
        const newNode = await createStoryNode(
          storyId,
          newNodeKey,
          generatedStory.content,
          generatedStory.isEnding,
          generatedStory.endingType,
          updatedChapters.length,
          choice.id
        );

        await supabase.from('story_choices').update({ to_node_id: newNode.id }).eq('id', choice.id);

        const newChoices = [];
        if (!generatedStory.isEnding) {
          if (!generatedStory.choices || generatedStory.choices.length === 0) {
            console.error('AI returned no choices for non-ending story:', generatedStory);
            throw new Error('Story generation failed: No choices provided for continuing story');
          }

          for (let i = 0; i < generatedStory.choices.length; i++) {
            const ch = generatedStory.choices[i];
            const placeholderNode = await createStoryNode(
              storyId,
              `${generateUniqueNodeKey()}_placeholder`,
              '',
              false,
              null,
              i + 1,
              null
            );

            const createdChoice = await createStoryChoice(
              newNode.id,
              placeholderNode.id,
              ch.text,
              ch.hint,
              i
            );
            newChoices.push({ ...createdChoice, to_node: placeholderNode });
          }
        }

        const newPath = [...pathTaken, newNodeKey];
        setPathTaken(newPath);

        await saveProgress(userId, storyId, newNode.id, newPath, generatedStory.isEnding);

        const newChapter: StoryChapter = {
          node: newNode,
          choices: newChoices,
          imageUrl: null,
          generatingImage: false, // Show content immediately
        };

        setChapters([...baseChapters, newChapter]);
        setIsGenerating(false);

        await trackChapterRead(userId, storyId, newNode.id, story.created_by || null);

        if (generatedStory.isEnding) {
          await trackStoryCompletion(userId, storyId, story.created_by || null);
        }

        // Generate image in background without blocking (fire and forget)
        if (story) {
          startImageGeneration(
            newNode.id,
            newNode.content,
            {
              storyTitle: story.title,
              artStyle: story.art_style,
              storyDescription: story.description ?? undefined,
              styleReference: imageStyleReference,
              storyId,
              previousPrompt: imageStyleReference,
            },
            async (imageUrl) => {
              await updateNodeImage(newNode.id, imageUrl, newNode.content.substring(0, 200));
            }
          );
        }
      } catch (error) {
        console.error('Error generating next chapter:', error);
        setStoryError(
          error instanceof Error ? error.message : 'Story generation failed. Please try again.'
        );
        setChapters(
          baseChapters.map((chapter, idx) =>
            idx === chapterIndex ? { ...chapter, selectedChoiceId: undefined } : chapter
          )
        );
        setIsGenerating(false);
      }
    } else {
      const newPath = [...pathTaken, choice.to_node.node_key];
      setPathTaken(newPath);
      const toNodeIsEnding = choice.to_node.is_ending ?? false;

      await saveProgress(userId, storyId, choice.to_node.id, newPath, toNodeIsEnding);

      const nextChoices = toNodeIsEnding ? [] : await getNodeChoices(choice.to_node.id);

      if (!toNodeIsEnding && nextChoices.length === 0 && story?.story_context) {
        console.log('Node has no choices, generating them dynamically...');
        setIsGenerating(true);

        try {
          const generatedStory = await generateStory(
            story.story_context,
            choice.choice_text,
            currentNode.content
          );

          if (!generatedStory.choices || generatedStory.choices.length === 0) {
            throw new Error('Failed to generate choices for existing node');
          }

          const newChoices = [];
          for (let i = 0; i < generatedStory.choices.length; i++) {
            const ch = generatedStory.choices[i];
            const placeholderNode = await createStoryNode(
              storyId,
              `${generateUniqueNodeKey()}_placeholder`,
              '',
              false,
              null,
              i + 1,
              null
            );

            const createdChoice = await createStoryChoice(
              choice.to_node.id,
              placeholderNode.id,
              ch.text,
              ch.hint,
              i
            );
            newChoices.push({ ...createdChoice, to_node: placeholderNode });
          }

          const existingImageUrl = choice.to_node.image_url;
          const newChapter: StoryChapter = {
            node: choice.to_node,
            choices: newChoices,
            imageUrl: existingImageUrl,
            generatingImage: false,
          };

          setChapters([...updatedChapters, newChapter]);
          setIsGenerating(false);
        } catch (error) {
          console.error('Error generating choices for node:', error);
          setIsGenerating(false);
          const existingImageUrl = choice.to_node.image_url;
          setChapters([
            ...updatedChapters,
            {
              node: choice.to_node,
              choices: [],
              imageUrl: existingImageUrl,
              generatingImage: false,
            },
          ]);
        }
      } else {
        const existingImageUrl = choice.to_node.image_url;
        const newChapter: StoryChapter = {
          node: choice.to_node,
          choices: nextChoices,
          imageUrl: existingImageUrl,
          generatingImage: false,
        };

        setChapters([...updatedChapters, newChapter]);
      }

      await trackChapterRead(userId, storyId, choice.to_node.id, story?.created_by || null);

      if (choice.to_node.is_ending) {
        await trackStoryCompletion(userId, storyId, story?.created_by || null);
      }

      // Generate image in background without blocking (fire and forget)
      if (story && !choice.to_node.image_url) {
        console.log('No cached image, generating new image for node in background');
        startImageGeneration(
          choice.to_node.id,
          choice.to_node.content,
          {
            storyTitle: story.title,
            artStyle: story.art_style,
            storyDescription: story.description ?? undefined,
            styleReference: imageStyleReference,
            storyId,
            previousPrompt: imageStyleReference,
          },
          async (imageUrl) => {
            await updateNodeImage(
              choice.to_node.id,
              imageUrl,
              choice.to_node.content.substring(0, 200)
            );
          }
        );
      } else if (choice.to_node.image_url) {
        console.log('Using cached image from database');
      }
    }
  };

  const handleDeleteChoice = async (chapterIndex: number, choiceId: string) => {
    try {
      await deleteStoryChoice(choiceId);
      // Remove the choice from the local state
      setChapters((prev) =>
        prev.map((ch, idx) =>
          idx === chapterIndex
            ? { ...ch, choices: ch.choices.filter((c) => c.id !== choiceId) }
            : ch
        )
      );
    } catch (error) {
      console.error('Error deleting choice:', error);
    }
  };

  const handleToggleChoiceVisibility = async (
    chapterIndex: number,
    choiceId: string,
    currentVisibility: boolean
  ) => {
    try {
      const newVisibility = !currentVisibility;
      await toggleChoiceVisibility(choiceId, newVisibility);
      // Update the local state
      setChapters((prev) =>
        prev.map((ch, idx) =>
          idx === chapterIndex
            ? {
                ...ch,
                choices: ch.choices.map((c) =>
                  c.id === choiceId ? { ...c, is_public: newVisibility } : c
                ),
              }
            : ch
        )
      );
    } catch (error) {
      console.error('Error toggling choice visibility:', error);
    }
  };

  const handleCustomChoice = async (chapterIndex: number, choiceText: string) => {
    if (!choiceText.trim() || !story?.story_context) return;

    const customChoiceText = choiceText.trim();
    stopSpeech();

    const currentNode = chapters[chapterIndex].node;

    // First, create the choice record in the database
    let customChoiceRecord;
    let customPlaceholderNode;
    try {
      customPlaceholderNode = await createStoryNode(
        storyId,
        `${generateUniqueNodeKey()}_custom_placeholder`,
        '',
        false,
        null,
        0,
        null
      );

      customChoiceRecord = await createStoryChoice(
        currentNode.id,
        customPlaceholderNode.id,
        customChoiceText,
        'Custom choice by reader',
        999,
        userId
      );
    } catch (error) {
      console.error('Error creating custom choice:', error);
      return;
    }

    // Add the custom choice to the current chapter's choices and mark it as selected
    const updatedChapters = [...chapters];
    const newChoice = {
      ...customChoiceRecord,
      to_node: customPlaceholderNode,
    };
    updatedChapters[chapterIndex].choices = [...updatedChapters[chapterIndex].choices, newChoice];
    updatedChapters[chapterIndex].selectedChoiceId = customChoiceRecord.id;

    const loadingChapter: StoryChapter = {
      node: {
        id: 'loading',
        story_id: storyId,
        node_key: 'loading',
        content: '✨ Generating your story...',
        is_ending: false,
        ending_type: null,
        sequence_order: updatedChapters.length,
        parent_choice_id: null,
        image_url: null,
        image_prompt: null,
        audio_url: null,
        created_at: new Date().toISOString(),
      },
      choices: [],
      imageUrl: null,
      generatingImage: false,
    };

    setChapters([...updatedChapters, loadingChapter]);

    try {
      setIsGenerating(true);
      const generatedStory = await generateStory(
        story.story_context,
        customChoiceText,
        currentNode.content
      );

      const newNodeKey = generateUniqueNodeKey();

      const newNode = await createStoryNode(
        storyId,
        newNodeKey,
        generatedStory.content,
        generatedStory.isEnding,
        generatedStory.endingType,
        updatedChapters.length,
        customChoiceRecord.id
      );

      await supabase
        .from('story_choices')
        .update({ to_node_id: newNode.id })
        .eq('id', customChoiceRecord.id);

      const newChoices = [];
      if (!generatedStory.isEnding) {
        if (generatedStory.choices && generatedStory.choices.length > 0) {
          for (let i = 0; i < generatedStory.choices.length; i++) {
            const ch = generatedStory.choices[i];
            const placeholderNode = await createStoryNode(
              storyId,
              `${generateUniqueNodeKey()}_placeholder`,
              '',
              false,
              null,
              i + 1,
              null
            );

            const createdChoice = await createStoryChoice(
              newNode.id,
              placeholderNode.id,
              ch.text,
              ch.hint,
              i
            );
            newChoices.push({ ...createdChoice, to_node: placeholderNode });
          }
        }
      }

      const newPath = [...pathTaken, newNodeKey];
      setPathTaken(newPath);

      await saveProgress(userId, storyId, newNode.id, newPath, generatedStory.isEnding);

      const newChapter: StoryChapter = {
        node: newNode,
        choices: newChoices,
        imageUrl: null,
        generatingImage: false,
      };

      setChapters([...updatedChapters, newChapter]);
      setIsGenerating(false);

      await trackChapterRead(userId, storyId, newNode.id, story.created_by || null);

      if (generatedStory.isEnding) {
        await trackStoryCompletion(userId, storyId, story.created_by || null);
      }

      // Generate image in background
      if (story) {
        startImageGeneration(
          newNode.id,
          newNode.content,
          {
            storyTitle: story.title,
            artStyle: story.art_style,
            storyDescription: story.description ?? undefined,
            styleReference: imageStyleReference,
            storyId,
            previousPrompt: imageStyleReference,
          },
          async (imageUrl) => {
            await updateNodeImage(newNode.id, imageUrl, newNode.content.substring(0, 200));
          }
        );
      }
    } catch (error) {
      console.error('Error generating custom chapter:', error);
      // Remove the loading chapter and keep the custom choice visible but unselected
      setChapters((prev) => {
        const withoutLoading = prev.filter((ch) => ch.node.id !== 'loading');
        // Unselect the custom choice so user can try again or select another
        if (withoutLoading[chapterIndex]) {
          withoutLoading[chapterIndex] = {
            ...withoutLoading[chapterIndex],
            selectedChoiceId: undefined,
          };
        }
        return withoutLoading;
      });
      setIsGenerating(false);
    }
  };

  const restartStory = () => {
    stopSpeech();
    setPathTaken(['start']);
    setStoryError(null);
    resetAutoPlay(); // Reset auto-play tracking for new read
    loadStoryNode('start');
  };

  const startEditingChapter = (chapterIndex: number) => {
    const chapter = chapters[chapterIndex];
    setEditingChapter(chapterIndex);
    setEditedContent(chapter.node.content);
    setEditingChoices(
      chapter.choices.map((c) => ({ id: c.id, text: c.choice_text, hint: c.hint }))
    );
  };

  const cancelEdit = () => {
    setEditingChapter(null);
    setEditedContent('');
    setEditingChoices([]);
    setIsEditMode(false);
  };

  const saveChapterEdit = async (chapterIndex: number) => {
    const chapter = chapters[chapterIndex];
    try {
      await supabase
        .from('story_nodes')
        .update({ content: editedContent, audio_url: null })
        .eq('id', chapter.node.id);

      for (const choice of editingChoices) {
        await supabase
          .from('story_choices')
          .update({ choice_text: choice.text, hint: choice.hint })
          .eq('id', choice.id);
      }

      const updatedChapters = [...chapters];
      updatedChapters[chapterIndex] = {
        ...chapter,
        node: { ...chapter.node, content: editedContent, audio_url: null },
        choices: chapter.choices.map((c) => {
          const edited = editingChoices.find((ec) => ec.id === c.id);
          return edited ? { ...c, choice_text: edited.text, hint: edited.hint } : c;
        }),
      };
      setChapters(updatedChapters);

      cancelEdit();
    } catch (error) {
      console.error('Error saving edit:', error);
      setError('Failed to save changes');
    }
  };

  const addNewChoice = () => {
    setEditingChoices([...editingChoices, { id: `new_${Date.now()}`, text: '', hint: null }]);
  };

  const removeChoice = (index: number) => {
    setEditingChoices(editingChoices.filter((_, i) => i !== index));
  };

  const updateChoice = (index: number, field: 'text' | 'hint', value: string) => {
    const updated = [...editingChoices];
    updated[index] = { ...updated[index], [field]: value };
    setEditingChoices(updated);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-950 pb-20">
        <div className="flex gap-2">
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-600"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-600"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-gray-600"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    );
  }

  const currentChapter = chapters[chapters.length - 1];
  const isStoryEnded = currentChapter?.node.is_ending;

  const handleChapterClick = (index: number) => {
    const element = document.getElementById(`chapter-${index}`);
    if (element) scrollToElement(element);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sticky Header */}
      <StoryHeader
        ref={stickyHeaderRef}
        title={story?.title}
        description={story?.description}
        chapters={chapters}
        isPro={isPro}
        onChapterClick={handleChapterClick}
      />

      <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">
        {audioError && (
          <ErrorAlert
            title="Audio Error"
            message={audioError}
            onDismiss={clearAudioError}
          />
        )}
        {error && (
          <ErrorAlert
            title="Error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        <div className="space-y-6">
          {storyError && (
            <ErrorAlert
              title="Story Error"
              message={storyError}
              onDismiss={() => setStoryError(null)}
            />
          )}

          {chapters.map((chapter, chapterIndex) => (
            <div
              key={chapterIndex}
              id={`chapter-${chapterIndex}`}
              ref={chapterIndex === chapters.length - 1 ? latestChapterRef : null}
            >
              {chapter.node.id === 'loading' ? (
                <LoadingChapter isPro={isPro} />
              ) : (
                <ChapterCard
                  chapterIndex={chapterIndex}
                  node={chapter.node}
                  imageUrl={chapter.imageUrl}
                  generatingImage={chapter.generatingImage}
                  videoUrl={chapter.videoUrl}
                  generatingVideo={chapter.generatingVideo}
                  isPro={isPro}
                  isOwner={isOwner}
                  hasEditMode={hasEditMode}
                  hasVideoClips={hasVideoClips}
                  videoEnabled={story?.video_enabled ?? undefined}
                  narratorEnabled={story?.narrator_enabled ?? undefined}
                  isEditMode={isEditMode}
                  isPlaying={playingChapterId === chapter.node.id && isSpeaking}
                  isAudioLoading={audioLoadingChapters.has(chapter.node.id)}
                  currentWordIndex={currentWordIndex}
                  playingChapterId={playingChapterId}
                  storyTitle={story?.title}
                  isEditing={editingChapter === chapterIndex}
                  editedContent={editedContent}
                  onContentChange={setEditedContent}
                  onSaveEdit={() => saveChapterEdit(chapterIndex)}
                  onCancelEdit={cancelEdit}
                  onToggleSpeech={toggleSpeech}
                  onStartEditing={() => {
                    setIsEditMode(true);
                    startEditingChapter(chapterIndex);
                  }}
                  onShowUpgrade={() => setShowUpgradeModal(true)}
                  onStartVideoGeneration={(nodeId, imageUrl, prompt) => {
                    startVideoGeneration(nodeId, imageUrl, prompt, async (videoUrl) => {
                      await supabase
                        .from('story_nodes')
                        .update({ video_url: videoUrl })
                        .eq('id', nodeId);
                      if (chapterIndex === 0 && storyId) {
                        await supabase
                          .from('stories')
                          .update({ cover_video_url: videoUrl })
                          .eq('id', storyId);
                      }
                    });
                  }}
                />
              )}

              {chapter.node.id !== 'loading' &&
                chapter.choices.length > 0 &&
                editingChapter !== chapterIndex && (
                  <ChoiceSelector
                    choices={chapter.choices}
                    selectedChoiceId={chapter.selectedChoiceId}
                    userId={userId}
                    isOwner={isOwner}
                    hasEditMode={hasEditMode}
                    hasVoiceInput={hasVoiceInput}
                    isVoiceSupported={isVoiceSupported}
                    isListening={isListening && voiceInputChapterIndex === chapterIndex}
                    voiceTranscript={voiceTranscript}
                    voiceMatchedChoice={voiceMatchedChoice}
                    onChoiceSelect={(choice) => handleChoice(chapterIndex, choice)}
                    onDeleteChoice={(choiceId) => handleDeleteChoice(chapterIndex, choiceId)}
                    onToggleVisibility={(choiceId, isPublic) =>
                      handleToggleChoiceVisibility(chapterIndex, choiceId, isPublic)
                    }
                    onCustomChoice={(choiceText) => handleCustomChoice(chapterIndex, choiceText)}
                    onToggleVoiceInput={() => toggleVoiceInput(chapterIndex)}
                    onShowUpgrade={() => setShowUpgradeModal(true)}
                  />
                )}

              {editingChapter === chapterIndex && !chapter.node.is_ending && (
                <div className="mb-8 space-y-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-300">Edit Choices</h3>
                    <button
                      onClick={addNewChoice}
                      className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Choice
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingChoices.map((choice, idx) => (
                      <div key={choice.id} className="rounded-xl bg-gray-800 p-4">
                        <div className="mb-3 flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={choice.text}
                              onChange={(e) => updateChoice(idx, 'text', e.target.value)}
                              className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 p-2 text-white focus:border-purple-500 focus:outline-none"
                              placeholder="Choice text..."
                            />
                            <input
                              type="text"
                              value={choice.hint || ''}
                              onChange={(e) => updateChoice(idx, 'hint', e.target.value)}
                              className="w-full rounded-lg border-2 border-gray-700 bg-gray-900 p-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                              placeholder="Hint (optional)..."
                            />
                          </div>
                          <button
                            onClick={() => removeChoice(idx)}
                            className="rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {isStoryEnded && (
          <>
            {/* Main Card Container - same width as chapters */}
            <div className="mt-6 space-y-4 rounded-3xl border border-gray-800 bg-gray-900 p-4 shadow-xl">
              {/* Creator Card */}
              {story?.creator && (
                <CreatorCard
                  creator={story.creator}
                  createdBy={story.created_by}
                  onViewProfile={onViewProfile}
                  isPro={isPro}
                />
              )}

              {/* Reaction Card */}
              <StoryActions
                storyId={storyId}
                storyTitle={story?.title}
                userId={userId}
                userReaction={userReaction}
                likesCount={likesCount}
                dislikesCount={dislikesCount}
                onReactionChange={handleReaction}
              />
            </div>

            <div className="mt-6 flex gap-4 pb-4">
              <button
                onClick={restartStory}
                className="flex-1 rounded-2xl bg-gray-800 py-3 text-sm font-semibold text-gray-300 shadow-md transition-all hover:bg-gray-700 hover:shadow-lg"
              >
                Read Again
              </button>
              <button
                onClick={onComplete}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl ${isPro ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90' : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'}`}
              >
                Explore More
              </button>
            </div>
          </>
        )}

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      </div>
    </div>
  );
}
