/**
 * Header Tabs Component
 * Preview/Code tab buttons for the builder header
 */

import { Eye, Code2 } from 'lucide-react';

export type BuilderViewMode = 'preview' | 'code';

interface HeaderTabsProps {
  viewMode: BuilderViewMode;
  onViewModeChange: (mode: BuilderViewMode) => void;
}

export function HeaderTabs({ viewMode, onViewModeChange }: HeaderTabsProps) {
  return (
    <div className="flex items-center rounded-lg bg-gray-800/50 p-1">
      <button
        onClick={() => onViewModeChange('preview')}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'preview'
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Eye className="h-4 w-4" />
        Preview
      </button>
      <button
        onClick={() => onViewModeChange('code')}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'code'
            ? 'bg-gray-700 text-white'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Code2 className="h-4 w-4" />
        Code
      </button>
    </div>
  );
}
