import { useState } from 'react';
import { Mic, MicOff, Trash2, Eye, EyeOff, Check, X, Pen } from 'lucide-react';
import type { StoryChoice, StoryNode } from '../../../lib/types';

interface ChoiceSelectorProps {
  choices: (StoryChoice & { to_node: StoryNode })[];
  selectedChoiceId?: string;
  userId: string;
  isOwner: boolean;
  hasEditMode: boolean;
  hasVoiceInput: boolean;
  isVoiceSupported: boolean;
  isListening: boolean;
  voiceTranscript: string;
  voiceMatchedChoice: string | null;
  onChoiceSelect: (choice: StoryChoice & { to_node: StoryNode }) => void;
  onDeleteChoice: (choiceId: string) => void;
  onToggleVisibility: (choiceId: string, currentVisibility: boolean) => void;
  onCustomChoice: (choiceText: string) => void;
  onToggleVoiceInput: () => void;
  onShowUpgrade: () => void;
}

export function ChoiceSelector({
  choices,
  selectedChoiceId,
  userId,
  isOwner,
  hasEditMode,
  hasVoiceInput,
  isVoiceSupported,
  isListening,
  voiceTranscript,
  voiceMatchedChoice,
  onChoiceSelect,
  onDeleteChoice,
  onToggleVisibility,
  onCustomChoice,
  onToggleVoiceInput,
  onShowUpgrade,
}: ChoiceSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customChoice, setCustomChoice] = useState('');

  const handleSubmitCustomChoice = () => {
    if (!customChoice.trim()) return;
    onCustomChoice(customChoice.trim());
    setCustomChoice('');
    setShowCustomInput(false);
  };

  // Filter out private choices from other users
  const visibleChoices = choices.filter((choice) => {
    const isOwnChoice = choice.created_by === userId;
    const isPublic = choice.is_public !== false;
    return isOwnChoice || isPublic;
  });

  return (
    <div className="mb-6 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">What should happen next?</h3>
        {isVoiceSupported && !selectedChoiceId && (
          <button
            onClick={() => {
              if (!hasVoiceInput) {
                onShowUpgrade();
                return;
              }
              onToggleVoiceInput();
            }}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              isListening
                ? 'animate-pulse bg-red-500 text-white'
                : hasVoiceInput
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'border border-purple-500/50 bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="h-3.5 w-3.5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" />
                <span>Speak Choice</span>
                {!hasVoiceInput && (
                  <span className="rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold">
                    PRO
                  </span>
                )}
              </>
            )}
          </button>
        )}
      </div>

      {/* Voice transcript display */}
      {isListening && (
        <div className="mb-4 rounded-xl border border-purple-500/50 bg-purple-900/30 p-3">
          <p className="mb-1 text-xs text-purple-300">
            Listening... Say a choice or number (1, 2, 3...)
          </p>
          <p className="text-sm font-medium text-white">{voiceTranscript || '🎤 Speak now...'}</p>
        </div>
      )}

      <div className="space-y-3">
        {visibleChoices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;
          const isDisabled = selectedChoiceId !== undefined;
          const isOwnChoice = choice.created_by === userId;
          const isAiGenerated = !choice.created_by;
          const hasMinimumChoices = visibleChoices.length <= 2;

          // Allow deletion if:
          // 1. AI-generated choices - NO ONE can delete
          // 2. User's own choices - can delete on any story
          // 3. Other people's choices - story owner can delete them
          const isUserCreatedChoice = !isAiGenerated;
          const canDeleteChoice = isUserCreatedChoice && (isOwnChoice || isOwner);
          const canDelete = canDeleteChoice && !hasMinimumChoices;
          const isPublic = choice.is_public !== false;

          // Calculate right padding based on visible buttons
          const hasButtons = (isOwnChoice && !isDisabled) || (canDelete && !isDisabled);
          const buttonCount =
            (isOwnChoice && !isDisabled ? 1 : 0) + (canDelete && !isDisabled ? 1 : 0);

          const isVoiceMatched = voiceMatchedChoice === choice.id;

          return (
            <div key={choice.id} className="relative">
              <button
                onClick={() => onChoiceSelect(choice)}
                disabled={isDisabled}
                className={`group relative w-full rounded-xl bg-gray-800 p-4 text-left shadow-sm transition-all duration-300 ${
                  isOwnChoice ? 'border-2 border-dashed border-purple-500' : ''
                }${
                  isVoiceMatched
                    ? 'animate-pulse bg-purple-900/50 shadow-lg ring-2 ring-purple-500'
                    : isSelected
                      ? 'bg-green-900/30 shadow-md ring-2 ring-green-500'
                      : isDisabled
                        ? 'opacity-30'
                        : 'hover:bg-gray-700 hover:shadow-md hover:ring-2 hover:ring-purple-500'
                }`}
              >
                <div
                  className={`relative ${hasButtons ? `pr-${buttonCount * 10}` : ''}`}
                  style={{
                    paddingRight: hasButtons ? `${buttonCount * 2.5}rem` : undefined,
                  }}
                >
                  <p className="mb-1 text-sm font-semibold text-white">{choice.choice_text}</p>
                  {choice.consequence_hint && (
                    <p className="text-xs italic text-gray-400">💭 {choice.consequence_hint}</p>
                  )}
                </div>
              </button>
              {/* Action buttons container */}
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
                {canDelete && !isDisabled && (
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

      {/* Custom Choice Input - Pro Feature */}
      {!selectedChoiceId &&
        (showCustomInput ? (
          <div className="mt-3 rounded-xl border-2 border-dashed border-purple-500 bg-purple-900/20 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customChoice}
                onChange={(e) => setCustomChoice(e.target.value)}
                placeholder="Write your own choice"
                className="flex-1 rounded-xl border-2 border-gray-700 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                maxLength={100}
                autoFocus
              />
              <button
                onClick={handleSubmitCustomChoice}
                disabled={!customChoice.trim()}
                className="rounded-xl bg-gray-700 p-3 text-green-400 shadow-md transition-all hover:bg-green-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-700 disabled:hover:text-green-400"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomChoice('');
                }}
                className="rounded-xl bg-gray-700 p-3 text-red-400 shadow-md transition-all hover:bg-red-600 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              if (hasEditMode) {
                setShowCustomInput(true);
              } else {
                onShowUpgrade();
              }
            }}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-medium transition-all ${hasEditMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:opacity-90' : 'border-2 border-dashed border-blue-500 text-blue-400 hover:bg-blue-900/30'}`}
          >
            <Pen className="h-5 w-5" />
            <span>Write your own choice</span>
          </button>
        ))}
    </div>
  );
}
