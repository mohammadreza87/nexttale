/**
 * Builder Header Component
 * Top navigation bar with project info, status, share, upgrade, publish, and user controls
 */

import type { User } from '@supabase/supabase-js';
import {
  Sparkles,
  Download,
  LogOut,
  ArrowLeft,
  Share2,
  Rocket,
  Crown,
  ExternalLink,
} from 'lucide-react';
import type { WebContainerStatus } from '../../hooks/useWebContainer';
import { Avatar } from '../Avatar';

interface BuilderHeaderProps {
  projectName: string;
  user: User;
  status: WebContainerStatus;
  onBackToHome: () => void;
  onExport: () => void;
  onSignOut: () => void;
  onShare?: () => void;
  onPublish?: () => void;
  onUpgrade?: () => void;
  isPublished?: boolean;
  publishedUrl?: string;
}

export function BuilderHeader({
  projectName,
  user,
  status,
  onBackToHome,
  onExport,
  onSignOut,
  onShare,
  onPublish,
  onUpgrade,
  isPublished = false,
  publishedUrl,
}: BuilderHeaderProps) {
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready';
      case 'booting':
        return 'Booting...';
      case 'ready':
        return 'Ready';
      case 'installing':
        return 'Installing...';
      case 'running':
        return 'Running';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'installing':
      case 'booting':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
      {/* Left section - Logo and project name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          title="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-white">{projectName}</span>
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor()}`} />
            <span className="text-xs text-gray-500">{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Center section - Action buttons */}
      <div className="flex items-center gap-2">
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
          className="flex items-center gap-2 rounded-lg border border-yellow-600/30 bg-yellow-600/10 px-3 py-1.5 text-sm text-yellow-400 transition-colors hover:border-yellow-500/50 hover:bg-yellow-600/20"
        >
          <Crown className="h-4 w-4" />
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
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" />
            Publish
          </button>
        )}
      </div>

      {/* Right section - Export and user */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExport}
          disabled={status !== 'running'}
          className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export
        </button>

        <div className="ml-2 flex items-center gap-2 border-l border-gray-700 pl-4">
          <Avatar
            src={user.user_metadata?.avatar_url}
            name={user.user_metadata?.full_name || user.email}
            size="sm"
          />
          <button
            onClick={onSignOut}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
