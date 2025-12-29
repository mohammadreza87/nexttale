import { useState, useEffect } from 'react';
import {
  Loader,
  Wand2,
  Crown,
  Gamepad2,
  Wrench,
  LayoutGrid,
  HelpCircle,
  BarChart3,
  Save,
  X,
} from 'lucide-react';
import { generateInteractiveContent, createInteractiveContent } from '../../lib/interactiveService';
import { getSubscriptionUsage, type SubscriptionUsage } from '../../lib/subscriptionService';
import UsageBadge from '../UsageBadge';
import UpgradeModal from '../UpgradeModal';
import { InteractiveViewer } from './InteractiveViewer';
import type {
  ContentType,
  ContentStyle,
  GenerateInteractiveResponse,
} from '../../lib/interactiveTypes';

interface InteractiveCreatorProps {
  userId: string;
  onCreated: (contentId: string) => void;
}

type InteractiveContentType = Exclude<ContentType, 'story'>;

const CONTENT_TYPES: {
  type: InteractiveContentType;
  label: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
}[] = [
  {
    type: 'game',
    label: 'Game',
    icon: <Gamepad2 className="h-6 w-6" />,
    description: 'Interactive games like puzzles, arcade, memory',
    examples: [
      'A snake game with neon colors',
      'Memory card matching game',
      'Simple brick breaker game',
      'Whack-a-mole game',
      'Tic-tac-toe with AI opponent',
    ],
  },
  {
    type: 'tool',
    label: 'Tool',
    icon: <Wrench className="h-6 w-6" />,
    description: 'Useful utilities and calculators',
    examples: [
      'Tip calculator with split bill',
      'Unit converter (length, weight, temp)',
      'Color palette generator',
      'Password strength checker',
      'Pomodoro timer',
    ],
  },
  {
    type: 'widget',
    label: 'Widget',
    icon: <LayoutGrid className="h-6 w-6" />,
    description: 'Mini apps and interactive displays',
    examples: [
      'Animated digital clock',
      'Countdown timer to a date',
      'Random quote generator',
      'Simple mood tracker',
      'Daily affirmation display',
    ],
  },
  {
    type: 'quiz',
    label: 'Quiz',
    icon: <HelpCircle className="h-6 w-6" />,
    description: 'Interactive quizzes and trivia',
    examples: [
      'General knowledge trivia',
      'Which character are you quiz',
      'True or false science quiz',
      'Geography capital cities quiz',
      'Movie quotes quiz',
    ],
  },
  {
    type: 'visualization',
    label: 'Visualization',
    icon: <BarChart3 className="h-6 w-6" />,
    description: 'Data visualizations and animations',
    examples: [
      'Animated sorting algorithm',
      'Interactive solar system',
      'Particle system animation',
      'Wave interference simulation',
      'Fractal tree generator',
    ],
  },
];

const STYLES: { value: ContentStyle; label: string; description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Clean, professional look' },
  { value: 'playful', label: 'Playful', description: 'Fun, colorful design' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, elegant' },
  { value: 'retro', label: 'Retro', description: '80s/90s aesthetic' },
];

export function InteractiveCreator({ userId, onCreated }: InteractiveCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<InteractiveContentType>('game');
  const [style, setStyle] = useState<ContentStyle>('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  // Preview state
  const [generatedContent, setGeneratedContent] = useState<GenerateInteractiveResponse | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUsage();
  }, [userId]);

  const loadUsage = async () => {
    const data = await getSubscriptionUsage(userId);
    setUsage(data);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please describe what you want to create');
      return;
    }

    if (usage && !usage.canGenerate) {
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress('Generating your content with AI...');
    setGeneratedContent(null);

    try {
      const result = await generateInteractiveContent({
        prompt,
        contentType,
        style,
      });

      setGeneratedContent(result);
      setShowPreview(true);
      setProgress('Content generated! Preview below.');
      loadUsage();
    } catch (err) {
      console.error('Error generating content:', err);
      if (err instanceof Error && err.message === 'daily_limit_reached') {
        setShowUpgradeModal(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    setError(null);

    try {
      const content = await createInteractiveContent(userId, {
        title: generatedContent.title,
        description: generatedContent.description,
        content_type: contentType,
        html_content: generatedContent.html,
        generation_prompt: prompt,
        tags: generatedContent.tags,
        is_public: isPublic,
        estimated_interaction_time: generatedContent.estimatedTime,
      });

      onCreated(content.id);
    } catch (err) {
      console.error('Error saving content:', err);
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setGeneratedContent(null);
    setShowPreview(false);
    setProgress('');
  };

  const currentTypeInfo = CONTENT_TYPES.find((t) => t.type === contentType);

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Create Interactive</h1>
          <p className="text-sm text-gray-400">
            Games, tools, quizzes, and more - all generated by AI
          </p>
          <div className="mt-4 flex justify-center">
            <UsageBadge onUpgradeClick={() => setShowUpgradeModal(true)} />
          </div>
        </div>

        {/* Preview Mode */}
        {showPreview && generatedContent && (
          <div className="mb-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <div>
                <h2 className="text-lg font-bold text-white">{generatedContent.title}</h2>
                <p className="text-sm text-gray-400">{generatedContent.description}</p>
              </div>
              <button
                onClick={handleDiscard}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="h-[60vh]">
              <InteractiveViewer
                htmlContent={generatedContent.html}
                title={generatedContent.title}
                className="h-full w-full"
              />
            </div>

            {/* Preview Actions */}
            <div className="space-y-4 border-t border-gray-800 p-4">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Visibility</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{isPublic ? 'Public' : 'Private'}</span>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {generatedContent.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {generatedContent.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-gray-800 px-2 py-1 text-xs text-gray-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-gray-800 py-3 font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white transition-colors hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Creation Form */}
        {!showPreview && (
          <div
            className={`relative mb-6 space-y-4 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl ${
              usage?.isPro ? 'pt-12' : ''
            }`}
          >
            {usage?.isPro && (
              <div className="absolute left-0 right-0 top-0 flex h-8 items-center justify-center gap-2 rounded-t-3xl bg-gradient-to-r from-purple-600 to-pink-600">
                <Crown className="h-4 w-4 text-white" />
                <span className="text-sm font-bold text-white">PRO</span>
              </div>
            )}

            {/* Content Type Selection */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">
                What do you want to create?
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => setContentType(type.type)}
                    disabled={isGenerating}
                    className={`rounded-xl p-3 text-left transition-all disabled:opacity-50 ${
                      contentType === type.type
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {type.icon}
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="line-clamp-1 text-xs opacity-80">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">
                Describe your {contentType}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`E.g., ${currentTypeInfo?.examples[0] || 'Describe what you want...'}`}
                className="h-28 w-full resize-none rounded-2xl border-2 border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                disabled={isGenerating}
              />

              {/* Example Suggestions */}
              {currentTypeInfo && (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold text-gray-500">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentTypeInfo.examples.slice(0, 3).map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(example)}
                        disabled={isGenerating}
                        className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-purple-400 transition-colors hover:bg-gray-700 disabled:opacity-50"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Style Selection */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">Visual Style</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    disabled={isGenerating}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
                      style === s.value
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-2xl border border-red-500/50 bg-red-900/30 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Progress Display */}
            {isGenerating && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader className="h-5 w-5 animate-spin text-purple-500" />
                <span className="text-gray-300">{progress}</span>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 py-6 text-lg font-bold text-white shadow-xl transition-all duration-200 hover:from-purple-700 hover:to-pink-700 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader className="h-6 w-6 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Wand2 className="h-6 w-6" />
                  Generate {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
                </>
              )}
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <div className="space-y-2 text-sm text-gray-300">
            <p className="font-semibold">How it works:</p>
            <ol className="list-inside list-decimal space-y-1 text-gray-400">
              <li>Choose what type of content you want</li>
              <li>Describe it in natural language</li>
              <li>AI generates a working interactive experience</li>
              <li>Preview, then publish to share with others</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveCreator;
