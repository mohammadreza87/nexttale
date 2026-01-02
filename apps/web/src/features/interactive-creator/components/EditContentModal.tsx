import { Loader, X, Sparkles } from 'lucide-react';

interface EditContentModalProps {
  editPrompt: string;
  isEditing: boolean;
  onPromptChange: (prompt: string) => void;
  onApply: () => void;
  onClose: () => void;
}

export function EditContentModal({
  editPrompt,
  isEditing,
  onPromptChange,
  onApply,
  onClose,
}: EditContentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Edit with AI</h3>
          </div>
          <button
            onClick={onClose}
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
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g., Change the colors to blue and green, add a restart button, make the text larger..."
          className="mb-4 h-32 w-full resize-none rounded-xl border border-gray-700 bg-gray-800 p-4 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          disabled={isEditing}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isEditing}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 py-3 font-semibold text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
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
  );
}
