/**
 * Terminal Panel Component
 * Collapsible terminal output display
 */

import { Terminal as TerminalIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { Terminal } from '../Terminal';

interface TerminalPanelProps {
  output: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export function TerminalPanel({ output, isOpen, onToggle }: TerminalPanelProps) {
  return (
    <div
      className={`shrink-0 border-t border-gray-800 transition-all ${
        isOpen ? 'h-48' : 'h-8'
      }`}
    >
      {/* Terminal header */}
      <button
        onClick={onToggle}
        className="flex h-8 w-full items-center justify-between bg-gray-900 px-3 text-sm hover:bg-gray-800"
      >
        <div className="flex items-center gap-2 text-gray-400">
          <TerminalIcon className="h-4 w-4" />
          <span>Terminal</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Terminal content */}
      {isOpen && (
        <div className="h-40 overflow-hidden">
          <Terminal output={output} />
        </div>
      )}
    </div>
  );
}
