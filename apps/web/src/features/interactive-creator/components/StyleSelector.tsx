import type { ContentStyle } from '../../../lib/interactiveTypes';

export const STYLES: { value: ContentStyle; label: string; description: string }[] = [
  { value: 'modern', label: 'Modern', description: 'Clean, professional look' },
  { value: 'playful', label: 'Playful', description: 'Fun, colorful design' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, elegant' },
  { value: 'retro', label: 'Retro', description: '80s/90s aesthetic' },
];

interface StyleSelectorProps {
  selectedStyle: ContentStyle;
  onStyleChange: (style: ContentStyle) => void;
  disabled?: boolean;
}

export function StyleSelector({
  selectedStyle,
  onStyleChange,
  disabled,
}: StyleSelectorProps) {
  return (
    <div className="rounded-2xl bg-gray-800/50 p-4">
      <label className="mb-3 block text-sm font-semibold text-gray-300">Visual Style</label>
      <div className="grid grid-cols-2 gap-2">
        {STYLES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onStyleChange(s.value)}
            disabled={disabled}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
              selectedStyle === s.value
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
