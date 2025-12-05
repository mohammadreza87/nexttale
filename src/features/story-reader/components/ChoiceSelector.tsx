import { useState } from 'react';
import { Eye, EyeOff, Trash2, Pen, Check, X } from 'lucide-react';
import type { StoryChoice, StoryNode } from '../../../lib/types';

interface ChoiceWithNode extends StoryChoice {
  to_node: StoryNode;
}

interface ChoiceSelectorProps {
  choices: ChoiceWithNode[];
  selectedChoiceId: string | undefined;
  userId: string;
  isOwner: boolean;
  isPro: boolean;
  onSelectChoice: (choice: ChoiceWithNode) => void;
  onDeleteChoice: (choiceId: string) => void;
  onToggleVisibility: (choiceId: string, currentVisibility: boolean) => void;
  onCustomChoice: (choiceText: string) => void;
  onUpgradeClick: () => void;
}

export function ChoiceSelector({
  choices,
  selectedChoiceId,
  userId,
  isOwner,
  isPro,
  onSelectChoice,
  onDeleteChoice,
  onToggleVisibility,
  onCustomChoice,
  onUpgradeClick,
}: ChoiceSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customChoiceText, setCustomChoiceText] = useState('');

  // Filter choices - show own choices and public choices
  const visibleChoices = choices.filter((choice) => {
    const isOwnChoice = choice.created_by === userId;
    const isPublic = choice.is_public !== false;
    return isOwnChoice || isPublic;
  });

  const handleSubmitCustomChoice = () => {
    if (customChoiceText.trim()) {
      onCustomChoice(customChoiceText.trim());
      setCustomChoiceText('');
      setShowCustomInput(false);
    }
  };

  const handleCustomChoiceClick = () => {
    if (isPro) {
      setShowCustomInput(true);
    } else {
      onUpgradeClick();
    }
  };

  return (
    <div className="mb-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
      <h3 className="mb-4 text-sm font-semibold text-gray-300">What should happen next?</h3>

      <div className="space-y-3">
        {visibleChoices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;
          const isDisabled = selectedChoiceId !== undefined;
          const isOwnChoice = choice.created_by === userId;
          const isAiGenerated = !choice.created_by;
          const isPublic = choice.is_public !== false;

          // Can delete if: user-created and (own choice or story owner) and more than 2 choices
          const canDelete =
            !isAiGenerated && (isOwnChoice || isOwner) && visibleChoices.length > 2 && !isDisabled;

          return (
            <div key={choice.id} className="relative">
              <button
                onClick={() => onSelectChoice(choice)}
                disabled={isDisabled}
                className={`group relative w-full rounded-xl bg-gray-800 p-4 text-left shadow-sm transition-all duration-300 ${
                  isOwnChoice ? 'border-2 border-dashed border-purple-500' : ''
                } ${
                  isSelected
                    ? 'bg-green-900/30 shadow-md ring-2 ring-green-500'
                    : isDisabled
                      ? 'opacity-30'
                      : 'hover:bg-gray-700 hover:shadow-md hover:ring-2 hover:ring-purple-500'
                }`}
              >
                <div
                  className="relative"
                  style={{
                    paddingRight:
                      (isOwnChoice && !isDisabled ? 1 : 0) + (canDelete ? 1 : 0) > 0
                        ? `${((isOwnChoice && !isDisabled ? 1 : 0) + (canDelete ? 1 : 0)) * 2.5}rem`
                        : undefined,
                  }}
                >
                  <p className="mb-1 text-sm font-semibold text-white">{choice.choice_text}</p>
                  {choice.consequence_hint && (
                    <p className="text-xs italic text-gray-400">💭 {choice.consequence_hint}</p>
                  )}
                </div>
              </button>

              {/* Action buttons */}
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {/* Visibility toggle - only for own choices */}
                {isOwnChoice && !isDisabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(choice.id, isPublic);
                    }}
                    className={`rounded-lg p-2 shadow-sm transition-all ${
                      isPublic
                        ? 'bg-gray-700 text-purple-400 hover:bg-purple-600 hover:text-white'
                        : 'bg-purple-900/50 text-purple-400 hover:bg-purple-600 hover:text-white'
                    }`}
                    aria-label={isPublic ? 'Hide from others' : 'Show to others'}
                    title={
                      isPublic ? 'Visible to others - click to hide' : 'Hidden from others - click to show'
                    }
                  >
                    {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                )}

                {/* Delete button */}
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChoice(choice.id);
                    }}
                    className="rounded-lg bg-gray-700 p-2 text-red-400 shadow-sm transition-all hover:bg-red-600 hover:text-white"
                    aria-label="Delete choice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Choice Input */}
      {!selectedChoiceId && (
        <>
          {showCustomInput ? (
            <div className="mt-3 rounded-xl border-2 border-dashed border-purple-500 bg-purple-900/20 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customChoiceText}
                  onChange={(e) => setCustomChoiceText(e.target.value)}
                  placeholder="Write your own choice"
                  className="flex-1 rounded-xl border-2 border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  maxLength={100}
                  autoFocus
                />
                <button
                  onClick={handleSubmitCustomChoice}
                  disabled={!customChoiceText.trim()}
                  className="rounded-xl bg-gray-700 p-3 text-green-400 shadow-md transition-all hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-700 disabled:hover:text-green-400"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomChoiceText('');
                  }}
                  className="rounded-xl bg-gray-700 p-3 text-red-400 shadow-md transition-all hover:bg-red-600 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCustomChoiceClick}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-medium transition-all ${
                isPro
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:opacity-90'
                  : 'border-2 border-dashed border-blue-500 text-blue-400 hover:bg-blue-900/30'
              }`}
            >
              <Pen className="h-5 w-5" />
              <span>Write your own choice</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
