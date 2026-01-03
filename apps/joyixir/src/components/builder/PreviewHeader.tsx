/**
 * Preview Header Component
 * Header for the preview panel with view tabs, device toggles, and action buttons (Lovable-style)
 */

import type { User } from '@supabase/supabase-js';
import {
  Share2,
  Rocket,
  Crown,
  ExternalLink,
  Plus,
} from 'lucide-react';
import type { WebContainerStatus } from '../../hooks/useWebContainer';
import { Avatar } from '../Avatar';
import { HeaderTabs, type BuilderViewMode } from './HeaderTabs';
import { DeviceToggle, type DeviceMode } from './DeviceToggle';

interface PreviewHeaderProps {
  user: User;
  status: WebContainerStatus;
  onShare?: () => void;
  onPublish?: () => void;
  onUpgrade?: () => void;
  isPublished?: boolean;
  publishedUrl?: string;
  // View mode and device toggles
  viewMode: BuilderViewMode;
  onViewModeChange: (mode: BuilderViewMode) => void;
  deviceMode: DeviceMode;
  onDeviceModeChange: (mode: DeviceMode) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function PreviewHeader({
  user,
  status,
  onShare,
  onPublish,
  onUpgrade,
  isPublished = false,
  publishedUrl,
  viewMode,
  onViewModeChange,
  deviceMode,
  onDeviceModeChange,
  onRefresh,
  isRefreshing = false,
}: PreviewHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-3">
      {/* Left section - View tabs, device toggles, and add button */}
      <div className="flex items-center gap-2">
        {/* Preview/Code/etc tabs */}
        <HeaderTabs viewMode={viewMode} onViewModeChange={onViewModeChange} />

        {/* Separator */}
        <div className="h-6 w-px bg-gray-700" />

        {/* Device toggles with refresh */}
        <DeviceToggle
          mode={deviceMode}
          onChange={onDeviceModeChange}
          onRefresh={onRefresh}
          isLoading={isRefreshing}
          disabled={status !== 'running'}
        />

        {/* Add button */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white"
          title="Add component"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Right section - Action buttons and user */}
      <div className="flex items-center gap-2">
        {/* User avatar */}
        <Avatar
          src={user.user_metadata?.avatar_url}
          name={user.user_metadata?.full_name || user.email}
          size="sm"
        />

        {/* Share button */}
        <button
          onClick={onShare}
          className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>

        {/* Upgrade button */}
        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white"
        >
          <Crown className="h-4 w-4 text-yellow-400" />
          Upgrade
        </button>

        {/* Publish button */}
        {isPublished && publishedUrl ? (
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-500"
          >
            <ExternalLink className="h-4 w-4" />
            View Live
          </a>
        ) : (
          <button
            onClick={onPublish}
            disabled={status !== 'running'}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Publish
          </button>
        )}
      </div>
    </header>
  );
}
