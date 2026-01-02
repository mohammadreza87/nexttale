import {
  Sparkles,
  BookOpen,
  Gamepad2,
  Wrench,
  LayoutGrid,
  HelpCircle,
  BarChart3,
} from 'lucide-react';
import type { FeedFilter } from '../../lib/interactiveTypes';

interface FeedFiltersProps {
  currentFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const FILTERS: {
  value: FeedFilter;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'all', label: 'For You', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'story', label: 'Stories', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'game', label: 'Games', icon: <Gamepad2 className="h-4 w-4" /> },
  { value: 'tool', label: 'Tools', icon: <Wrench className="h-4 w-4" /> },
  { value: 'widget', label: 'Widgets', icon: <LayoutGrid className="h-4 w-4" /> },
  { value: 'quiz', label: 'Quizzes', icon: <HelpCircle className="h-4 w-4" /> },
  { value: 'visualization', label: 'Viz', icon: <BarChart3 className="h-4 w-4" /> },
];

export function FeedFilters({ currentFilter, onFilterChange }: FeedFiltersProps) {
  return (
    <div className="scrollbar-hide w-full overflow-x-auto">
      <div className="flex min-w-max gap-2 px-4 py-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              currentFilter === filter.value
                ? 'bg-white text-black'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {filter.icon}
            <span>{filter.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default FeedFilters;
