import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Story, StoryNode, StoryChoice } from '../lib/types';

export interface StoryChapter {
  node: StoryNode;
  choices: (StoryChoice & { to_node: StoryNode })[];
  selectedChoiceId?: string;
  imageUrl?: string | null;
  generatingImage?: boolean;
}

interface StoryReaderState {
  // Story data
  story: Story | null;
  chapters: StoryChapter[];
  pathTaken: string[];

  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  generationStatus: string;

  // Audio state
  isSpeaking: boolean;
  playingChapterId: string | null;
  currentWordIndex: number;
  audioLoadingChapters: Set<string>;
  audioReadyChapters: Set<string>;

  // UI state
  isEditMode: boolean;
  editingChapter: number | null;
  error: string | null;
  storyError: string | null;

  // Actions - Story
  setStory: (story: Story | null) => void;
  setChapters: (chapters: StoryChapter[]) => void;
  addChapter: (chapter: StoryChapter) => void;
  updateChapter: (index: number, updates: Partial<StoryChapter>) => void;
  setPathTaken: (path: string[]) => void;

  // Actions - Generation
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationStatus: (status: string) => void;

  // Actions - Audio
  setIsSpeaking: (isSpeaking: boolean) => void;
  setPlayingChapterId: (chapterId: string | null) => void;
  setCurrentWordIndex: (index: number) => void;
  addAudioLoadingChapter: (chapterId: string) => void;
  removeAudioLoadingChapter: (chapterId: string) => void;
  addAudioReadyChapter: (chapterId: string) => void;

  // Actions - UI
  setIsEditMode: (isEditMode: boolean) => void;
  setEditingChapter: (index: number | null) => void;
  setError: (error: string | null) => void;
  setStoryError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  story: null,
  chapters: [],
  pathTaken: ['start'],
  isGenerating: false,
  generationProgress: 0,
  generationStatus: '',
  isSpeaking: false,
  playingChapterId: null,
  currentWordIndex: -1,
  audioLoadingChapters: new Set<string>(),
  audioReadyChapters: new Set<string>(),
  isEditMode: false,
  editingChapter: null,
  error: null,
  storyError: null,
};

export const useStoryReaderStore = create<StoryReaderState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Story actions
      setStory: (story) => set({ story }, false, 'setStory'),

      setChapters: (chapters) => set({ chapters }, false, 'setChapters'),

      addChapter: (chapter) =>
        set((state) => ({ chapters: [...state.chapters, chapter] }), false, 'addChapter'),

      updateChapter: (index, updates) =>
        set(
          (state) => ({
            chapters: state.chapters.map((ch, i) => (i === index ? { ...ch, ...updates } : ch)),
          }),
          false,
          'updateChapter'
        ),

      setPathTaken: (pathTaken) => set({ pathTaken }, false, 'setPathTaken'),

      // Generation actions
      setIsGenerating: (isGenerating) => set({ isGenerating }, false, 'setIsGenerating'),

      setGenerationProgress: (generationProgress) =>
        set({ generationProgress }, false, 'setGenerationProgress'),

      setGenerationStatus: (generationStatus) =>
        set({ generationStatus }, false, 'setGenerationStatus'),

      // Audio actions
      setIsSpeaking: (isSpeaking) => set({ isSpeaking }, false, 'setIsSpeaking'),

      setPlayingChapterId: (playingChapterId) =>
        set({ playingChapterId }, false, 'setPlayingChapterId'),

      setCurrentWordIndex: (currentWordIndex) =>
        set({ currentWordIndex }, false, 'setCurrentWordIndex'),

      addAudioLoadingChapter: (chapterId) =>
        set(
          (state) => ({
            audioLoadingChapters: new Set(state.audioLoadingChapters).add(chapterId),
          }),
          false,
          'addAudioLoadingChapter'
        ),

      removeAudioLoadingChapter: (chapterId) =>
        set(
          (state) => {
            const newSet = new Set(state.audioLoadingChapters);
            newSet.delete(chapterId);
            return { audioLoadingChapters: newSet };
          },
          false,
          'removeAudioLoadingChapter'
        ),

      addAudioReadyChapter: (chapterId) =>
        set(
          (state) => ({
            audioReadyChapters: new Set(state.audioReadyChapters).add(chapterId),
          }),
          false,
          'addAudioReadyChapter'
        ),

      // UI actions
      setIsEditMode: (isEditMode) => set({ isEditMode }, false, 'setIsEditMode'),

      setEditingChapter: (editingChapter) => set({ editingChapter }, false, 'setEditingChapter'),

      setError: (error) => set({ error }, false, 'setError'),

      setStoryError: (storyError) => set({ storyError }, false, 'setStoryError'),

      // Reset
      reset: () =>
        set(
          {
            ...initialState,
            audioLoadingChapters: new Set<string>(),
            audioReadyChapters: new Set<string>(),
          },
          false,
          'reset'
        ),
    }),
    { name: 'StoryReaderStore' }
  )
);

// Selectors
export const useStory = () => useStoryReaderStore((state) => state.story);
export const useChapters = () => useStoryReaderStore((state) => state.chapters);
export const useCurrentChapter = () =>
  useStoryReaderStore((state) => state.chapters[state.chapters.length - 1]);
export const useIsGenerating = () => useStoryReaderStore((state) => state.isGenerating);
export const useIsSpeaking = () => useStoryReaderStore((state) => state.isSpeaking);
