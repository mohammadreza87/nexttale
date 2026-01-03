/**
 * Project Dropdown Component
 * Shows project info, credits, and project-specific options
 */

import { useRef, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Coins,
  Settings,
  Copy,
  Pencil,
  Star,
  Palette,
  HelpCircle,
} from 'lucide-react';

interface ProjectDropdownProps {
  projectName: string;
  studioName?: string;
  creditsRemaining?: number;
  totalCredits?: number;
  isOpen: boolean;
  onToggle: () => void;
  onGoToDashboard: () => void;
  onOpenSettings?: () => void;
  onAddCredits?: () => void;
  onRenameProject?: () => void;
  onStarProject?: () => void;
  onRemixProject?: () => void;
  isStarred?: boolean;
}

export function ProjectDropdown({
  projectName,
  studioName = 'My Studio',
  creditsRemaining = 50,
  totalCredits = 50,
  isOpen,
  onToggle,
  onGoToDashboard,
  onOpenSettings,
  onAddCredits,
  onRenameProject,
  onStarProject,
  onRemixProject,
  isStarred = false,
}: ProjectDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showAppearanceSubmenu, setShowAppearanceSubmenu] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const usagePercentage = totalCredits > 0 ? ((totalCredits - creditsRemaining) / totalCredits) * 100 : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-800"
      >
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-white">{projectName}</p>
          <p className="text-xs text-gray-500">Previewing last saved version</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
          {/* Go to Dashboard */}
          <div className="border-b border-gray-700 p-2">
            <button
              onClick={() => {
                onToggle();
                onGoToDashboard();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Go to Dashboard</span>
            </button>
          </div>

          {/* Workspace Section */}
          <div className="border-b border-gray-700 p-3">
            <p className="mb-2 text-xs font-medium text-gray-500">{studioName}</p>

            {/* Credits */}
            <div className="rounded-lg bg-gray-900/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Credits</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-400">{creditsRemaining.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">left</span>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${100 - usagePercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                Daily credits reset at midnight UTC
              </div>
            </div>

            {/* Low on credits? */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">Low on credits?</span>
              <button
                onClick={() => {
                  onToggle();
                  onAddCredits?.();
                }}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500"
              >
                Add credits
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                onToggle();
                onAddCredits?.();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <Coins className="h-4 w-4" />
              <span className="text-sm">Get free credits</span>
            </button>

            <button
              onClick={() => {
                onToggle();
                onOpenSettings?.();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
              <span className="ml-auto text-xs text-gray-500">⌘</span>
            </button>

            <button
              onClick={() => {
                onToggle();
                onRemixProject?.();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <Copy className="h-4 w-4" />
              <span className="text-sm">Remix this project</span>
            </button>

            <button
              onClick={() => {
                onToggle();
                onRenameProject?.();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <Pencil className="h-4 w-4" />
              <span className="text-sm">Rename project</span>
            </button>

            <button
              onClick={() => {
                onToggle();
                onStarProject?.();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <Star className={`h-4 w-4 ${isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              <span className="text-sm">{isStarred ? 'Unstar project' : 'Star project'}</span>
            </button>

            {/* Appearance submenu */}
            <div className="relative">
              <button
                onClick={() => setShowAppearanceSubmenu(!showAppearanceSubmenu)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
              >
                <Palette className="h-4 w-4" />
                <span className="text-sm">Appearance</span>
                <ChevronRight className="ml-auto h-4 w-4" />
              </button>
            </div>

            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm">Help</span>
              <ChevronRight className="ml-auto h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
