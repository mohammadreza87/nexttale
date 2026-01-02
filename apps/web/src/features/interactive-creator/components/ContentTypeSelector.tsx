import { Gamepad2, Wrench, LayoutGrid, HelpCircle, BarChart3 } from 'lucide-react';
import type { InteractiveContentType } from '../../../lib/interactiveTypes';

export const CONTENT_TYPES: {
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

interface ContentTypeSelectorProps {
  selectedType: InteractiveContentType;
  onTypeChange: (type: InteractiveContentType) => void;
  disabled?: boolean;
}

export function ContentTypeSelector({
  selectedType,
  onTypeChange,
  disabled,
}: ContentTypeSelectorProps) {
  return (
    <div className="rounded-2xl bg-gray-800/50 p-4">
      <label className="mb-3 block text-sm font-semibold text-gray-300">
        What do you want to create?
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type.type}
            type="button"
            onClick={() => onTypeChange(type.type)}
            disabled={disabled}
            className={`rounded-xl p-3 text-left transition-all disabled:opacity-50 ${
              selectedType === type.type
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
  );
}

export function getContentTypeInfo(type: InteractiveContentType) {
  return CONTENT_TYPES.find((t) => t.type === type);
}
