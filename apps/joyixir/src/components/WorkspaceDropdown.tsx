/**
 * Workspace Dropdown Component
 * Shows workspace info, credits, upgrade option, and workspace switcher
 */

import { useRef, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Settings,
  UserPlus,
  Zap,
  ChevronDown,
  ChevronRight,
  Plus,
  Globe,
  Check,
  LogOut,
} from 'lucide-react';

interface WorkspaceDropdownProps {
  user: User;
  studioName?: string;
  plan?: 'free' | 'pro';
  creditsRemaining?: number;
  totalCredits?: number;
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onUpgrade?: () => void;
  onSignOut?: () => void;
  collapsed?: boolean;
}

export function WorkspaceDropdown({
  user,
  studioName = 'My Studio',
  plan = 'free',
  creditsRemaining = 50,
  totalCredits = 50,
  isOpen,
  onToggle,
  onOpenSettings,
  onUpgrade,
  onSignOut,
  collapsed = false,
}: WorkspaceDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showCreditsDetail, setShowCreditsDetail] = useState(false);

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
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-left transition-colors hover:bg-gray-700 ${
          collapsed ? 'justify-center px-2' : ''
        }`}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: getColorFromString(studioName) }}
        >
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">{studioName}</p>
              <p className="text-xs text-gray-500">
                {plan === 'pro' ? 'Pro Plan' : 'Free Plan'} • 1 member
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-xl ${
            collapsed ? 'left-full ml-2 top-0 w-72' : 'left-0 right-0 w-full min-w-[280px]'
          }`}
        >
          {/* Header - Workspace Info */}
          <div className="border-b border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-semibold text-white"
                style={{ backgroundColor: getColorFromString(studioName) }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-white">{studioName}</p>
                <p className="text-sm text-gray-500">
                  {plan === 'pro' ? 'Pro Plan' : 'Free Plan'} • 1 member
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  onToggle();
                  onOpenSettings();
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-600"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-600"
                onClick={() => {
                  // TODO: Implement invite members
                  console.log('Invite members clicked');
                }}
              >
                <UserPlus className="h-4 w-4" />
                Invite members
              </button>
            </div>
          </div>

          {/* Turn Pro Section */}
          {plan === 'free' && (
            <div className="border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-white">Turn Pro</span>
                </div>
                <button
                  onClick={() => {
                    onToggle();
                    onUpgrade?.();
                  }}
                  className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
                >
                  Upgrade
                </button>
              </div>
            </div>
          )}

          {/* Credits Section */}
          <div className="border-b border-gray-700 p-4">
            <button
              onClick={() => setShowCreditsDetail(!showCreditsDetail)}
              className="flex w-full items-center justify-between"
            >
              <span className="font-medium text-white">Credits</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{creditsRemaining} left</span>
                <ChevronRight
                  className={`h-4 w-4 text-gray-500 transition-transform ${
                    showCreditsDetail ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-300"
                  style={{ width: `${100 - usagePercentage}%` }}
                />
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
              Daily credits reset at midnight UTC
            </div>
          </div>

          {/* All Workspaces */}
          <div className="p-2">
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              All workspaces
            </p>

            {/* Current Workspace */}
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-700">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: getColorFromString(studioName) }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-white">{studioName}</p>
              </div>
              <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                {plan === 'pro' ? 'PRO' : 'FREE'}
              </span>
              <Check className="h-4 w-4 text-violet-400" />
            </button>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-700 p-2">
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-gray-400 hover:bg-gray-700 hover:text-white">
              <Plus className="h-4 w-4" />
              <span className="text-sm">Create new workspace</span>
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-gray-400 hover:bg-gray-700 hover:text-white">
              <Globe className="h-4 w-4" />
              <span className="text-sm">Find workspaces</span>
            </button>
          </div>

          {/* Sign Out */}
          {onSignOut && (
            <div className="border-t border-gray-700 p-2">
              <button
                onClick={() => {
                  onToggle();
                  onSignOut();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-gray-400 hover:bg-gray-700 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Generate a consistent color from a string
function getColorFromString(str: string): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
