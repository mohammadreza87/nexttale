import { useState, useEffect } from 'react';
import { Loader, Wand2, Crown } from 'lucide-react';
import {
  generateInteractiveContent,
  createInteractiveContent,
  editInteractiveContentWithPrompt,
} from '../../lib/interactiveService';
import { getSubscriptionUsage, type SubscriptionUsage } from '../../lib/subscriptionService';
import UsageBadge from '../UsageBadge';
import UpgradeModal from '../UpgradeModal';
import type {
  InteractiveContentType,
  ContentStyle,
  GenerateInteractiveResponse,
} from '../../lib/interactiveTypes';
import {
  ContentTypeSelector,
  getContentTypeInfo,
  StyleSelector,
  CreatorPreview,
  ImageUploadSection,
  EditContentModal,
} from '../../features/interactive-creator';

interface InteractiveCreatorProps {
  userId: string;
  onCreated: (contentId: string) => void;
}

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

  // Image upload state
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
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
      setShowUpgradeModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(
      imageData ? 'Analyzing image and generating content...' : 'Generating your content with AI...'
    );
    setGeneratedContent(null);

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

  const currentTypeInfo = getContentTypeInfo(contentType);

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
          <CreatorPreview
            content={generatedContent}
            isPublic={isPublic}
            isPro={usage?.isPro ?? false}
            isSaving={isSaving}
            isGenerating={isGenerating}
            isEditing={isEditing}
            onVisibilityChange={setIsPublic}
            onRegenerate={handleRegenerate}
            onEdit={() => setShowEditModal(true)}
            onSave={handleSave}
            onDiscard={handleDiscard}
          />
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
            <ContentTypeSelector
              selectedType={contentType}
              onTypeChange={setContentType}
              disabled={isGenerating}
            />

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
            <ImageUploadSection
              imagePreview={imagePreview}
              disabled={isGenerating}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
              onError={setError}
            />

            {/* Style Selection */}
            <StyleSelector
              selectedStyle={style}
              onStyleChange={setStyle}
              disabled={isGenerating}
            />

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
        <EditContentModal
          editPrompt={editPrompt}
          isEditing={isEditing}
          onPromptChange={setEditPrompt}
          onApply={handleEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

export default InteractiveCreator;
