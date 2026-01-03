/**
 * Chat Input Component
 * Text input for sending messages to the AI with suggestions
 * Note: Credits indicator moved to CreditsPanel component
 */

import { Send, Sparkles } from 'lucide-react';

interface SuggestionChip {
  label: string;
  prompt: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
  suggestions?: SuggestionChip[];
  onSuggestionClick?: (prompt: string) => void;
}

// Default quick suggestions
const DEFAULT_SUGGESTIONS: SuggestionChip[] = [
  { label: 'Add power-ups', prompt: 'Add power-up items that give special abilities' },
  { label: 'Sound effects', prompt: 'Add sound effects for game actions' },
  { label: 'Better graphics', prompt: 'Improve the visual design with animations and effects' },
];

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Describe what you want to build...',
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestionClick,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(prompt);
    } else {
      onChange(prompt);
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900/50 p-3">
      {/* Quick suggestion chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion.prompt)}
            disabled={disabled}
            className="flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800/50 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:border-violet-500/50 hover:bg-violet-600/10 hover:text-violet-300 disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3" />
            {suggestion.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-xl bg-gray-800 py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 outline-none ring-violet-500/50 transition-shadow focus:ring-2"
            disabled={disabled}
          />
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-violet-600 p-2 text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hint text */}
      <div className="mt-2 text-right text-xs text-gray-600">
        Press Enter to send
      </div>
    </div>
  );
}
