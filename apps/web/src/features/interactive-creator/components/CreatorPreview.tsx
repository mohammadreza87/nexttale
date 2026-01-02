import { Loader, Wand2, Save, X, Pencil } from 'lucide-react';
import { InteractiveViewer } from '../../../components/interactive/InteractiveViewer';
import type { GenerateInteractiveResponse } from '../../../lib/interactiveTypes';

interface CreatorPreviewProps {
  content: GenerateInteractiveResponse;
  isPublic: boolean;
  isPro: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  isEditing: boolean;
  onVisibilityChange: (isPublic: boolean) => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function CreatorPreview({
  content,
  isPublic,
  isPro,
  isSaving,
  isGenerating,
  isEditing,
  onVisibilityChange,
  onRegenerate,
  onEdit,
  onSave,
  onDiscard,
}: CreatorPreviewProps) {
  const isDisabled = isSaving || isGenerating || isEditing;

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-gray-800 bg-gray-900 shadow-xl">
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <div>
          <h2 className="text-lg font-bold text-white">{content.title}</h2>
          <p className="text-sm text-gray-400">{content.description}</p>
        </div>
        <button
          onClick={onDiscard}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preview Content */}
      <div className="h-[60vh]">
        <InteractiveViewer
          htmlContent={content.html}
          title={content.title}
          className="h-full w-full"
        />
      </div>

      {/* Preview Actions */}
      <div className="space-y-4 border-t border-gray-800 p-4">
        {/* Visibility Toggle - Only Pro users can make private */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Visibility</label>
            {!isPro && (
              <p className="text-xs text-gray-500">Pro only: make content private</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{isPublic ? 'Public' : 'Private'}</span>
            <button
              type="button"
              onClick={() => isPro && onVisibilityChange(!isPublic)}
              disabled={!isPro}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-700'
              } ${!isPro ? 'cursor-not-allowed opacity-50' : ''}`}
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
        {content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag, idx) => (
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
            onClick={onRegenerate}
            disabled={isDisabled}
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
            onClick={onEdit}
            disabled={isDisabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 py-3 font-semibold text-blue-400 transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            <Pencil className="h-5 w-5" />
            Edit
          </button>
          <button
            onClick={onSave}
            disabled={isDisabled}
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
  );
}
