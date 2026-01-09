import { useState, useEffect, useRef } from 'react';
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
  ImagePlus,
  Trash2,
  Pencil,
  Sparkles,
} from 'lucide-react';
import {
  generateInteractiveContent,
  createInteractiveContent,
  editInteractiveContentWithPrompt,
} from '../../lib/interactiveService';
import { getSubscriptionUsage, type SubscriptionUsage } from '../../lib/subscriptionService';
import UsageBadge from '../UsageBadge';
import UpgradeModal from '../UpgradeModal';
import { InteractiveViewer } from './InteractiveViewer';
import { usePostHog } from '../../hooks/usePostHog';
import type {
  InteractiveContentType,
  ContentStyle,
  GenerateInteractiveResponse,
} from '../../lib/interactiveTypes';

interface InteractiveCreatorProps {
  userId: string;
  onCreated: (contentId: string) => void;
}

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
  const [isPublic, setIsPublic] = useState(true); // Default to public
  const posthog = usePostHog();

  // Image upload state
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [generatedContent, setGeneratedContent] = useState<GenerateInteractiveResponse | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUsage();
  }, [userId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Create preview URL
      setImagePreview(result);
      // Extract base64 data (remove data URL prefix)
      const base64Data = result.split(',')[1];
      setImageData(base64Data);
      setImageType(file.type);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageData(null);
    setImageType(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadUsage = async () => {
    const data = await getSubscriptionUsage(userId);
    setUsage(data);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageData) {
      setError('Please describe what you want to create or upload an image');
      return;
    }

    if (usage && !usage.canGenerate) {
      posthog.freeLimitHit('ai_calls');
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(
      imageData ? 'Analyzing image and generating content...' : 'Generating your content with AI...'
    );
    setGeneratedContent(null);

    // Track creation started
    posthog.creationStarted(contentType === 'game' ? 'game' : 'interactive');

    try {
      const result = await generateInteractiveContent({
        prompt: prompt || (imageData ? 'Create something based on this image' : ''),
        contentType,
        style,
        imageData: imageData || undefined,
        imageType: imageType || undefined,
      });

      setGeneratedContent(result);
      setShowPreview(true);
      setProgress('Content generated! Preview below.');
      loadUsage();
    } catch (err) {
      console.error('Error generating content:', err);
      if (err instanceof Error && err.message === 'daily_limit_reached') {
        posthog.freeLimitHit('ai_calls');
        setShowUpgradeModal(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate. Please try again.');
        posthog.error('generation_failed', err instanceof Error ? err.message : 'Unknown error');
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
      // Free users can only create public content
      const finalIsPublic = usage?.isPro ? isPublic : true;

      const content = await createInteractiveContent(userId, {
        title: generatedContent.title,
        description: generatedContent.description,
        content_type: contentType,
        html_content: generatedContent.html,
        generation_prompt: prompt,
        tags: generatedContent.tags,
        is_public: finalIsPublic,
        estimated_interaction_time: generatedContent.estimatedTime,
      });

      // Track creation completed
      posthog.creationCompleted(contentType === 'game' ? 'game' : 'interactive', content.id, {
        title: generatedContent.title,
        prompt_length: prompt.length,
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

  const handleRegenerate = async () => {
    // Keep the preview open but regenerate content
    setIsGenerating(true);
    setError(null);
    setProgress('Regenerating with improved quality...');

    try {
      const result = await generateInteractiveContent({
        prompt: prompt || (imageData ? 'Create something based on this image' : ''),
        contentType,
        style,
        imageData: imageData || undefined,
        imageType: imageType || undefined,
      });

      setGeneratedContent(result);
      setProgress('New version generated!');
      loadUsage();
    } catch (err) {
      console.error('Error regenerating content:', err);
      if (err instanceof Error && err.message === 'daily_limit_reached') {
        setShowUpgradeModal(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to regenerate. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || !generatedContent?.html) return;

    setIsEditing(true);
    setError(null);
    setProgress('Applying your changes...');

    try {
      const result = await editInteractiveContentWithPrompt(generatedContent.html, editPrompt);

      setGeneratedContent({
        ...generatedContent,
        html: result.html,
        title: result.title || generatedContent.title,
        description: result.description || generatedContent.description,
      });

      setShowEditModal(false);
      setEditPrompt('');
      setProgress('Changes applied!');
    } catch (err) {
      console.error('Error editing content:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit. Please try again.');
    } finally {
      setIsEditing(false);
    }
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
              {/* Visibility Toggle - Only Pro users can make private */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">Visibility</label>
                  {!usage?.isPro && (
                    <p className="text-xs text-gray-500">Pro only: make content private</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{isPublic ? 'Public' : 'Private'}</span>
                  <button
                    type="button"
                    onClick={() => usage?.isPro && setIsPublic(!isPublic)}
                    disabled={!usage?.isPro}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-700'
                    } ${!usage?.isPro ? 'cursor-not-allowed opacity-50' : ''}`}
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
                  onClick={handleRegenerate}
                  disabled={isSaving || isGenerating || isEditing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 font-semibold text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      Regenerate
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  disabled={isSaving || isGenerating || isEditing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 font-semibold text-blue-400 transition-colors hover:bg-gray-700 disabled:opacity-50"
                >
                  <Pencil className="h-5 w-5" />
                  Edit
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isGenerating || isEditing}
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

            {/* Image Upload */}
            <div className="rounded-2xl bg-gray-800/50 p-4">
              <label className="mb-3 block text-sm font-semibold text-gray-300">
                Reference Image (Optional)
              </label>
              <p className="mb-3 text-xs text-gray-500">
                Upload an image to inspire the AI - it can recreate games, analyze charts, or use
                any visual as reference
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isGenerating}
              />

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="h-48 w-full rounded-xl bg-gray-900 object-contain"
                  />
                  <button
                    onClick={handleRemoveImage}
                    disabled={isGenerating}
                    className="absolute right-2 top-2 rounded-lg bg-red-500/80 p-2 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 py-8 text-gray-400 transition-colors hover:border-purple-500 hover:text-purple-400 disabled:opacity-50"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span>Click to upload an image</span>
                </button>
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
              disabled={isGenerating || (!prompt.trim() && !imageData)}
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
              <li>Describe it or upload a reference image</li>
              <li>AI generates a working interactive experience</li>
              <li>Preview, then publish to share with others</li>
            </ol>
            <p className="mt-3 text-xs text-purple-400">
              Tip: Upload a screenshot of a game to recreate it, or any image as inspiration!
            </p>
          </div>
        </div>
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
              disabled={isEditing}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isEditing}
                className="flex-1 rounded-xl border border-gray-700 bg-gray-800 py-3 font-semibold text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isEditing || !editPrompt.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isEditing ? (
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

export default InteractiveCreator;
