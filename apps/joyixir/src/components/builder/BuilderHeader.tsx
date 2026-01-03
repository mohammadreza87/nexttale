/**
 * Builder Header Component
 * Top navigation bar with project info, status, export, and user controls
 */

import type { User } from '@supabase/supabase-js';
import { Sparkles, Download, LogOut, ArrowLeft } from 'lucide-react';
import type { WebContainerStatus } from '../../hooks/useWebContainer';
import { Avatar } from '../Avatar';

interface BuilderHeaderProps {
  projectName: string;
  user: User;
  status: WebContainerStatus;
  onBackToHome: () => void;
  onExport: () => void;
  onSignOut: () => void;
}

export function BuilderHeader({
  projectName,
  user,
  status,
  onBackToHome,
  onExport,
  onSignOut,
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
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          title="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-white">{projectName}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
          <span className="text-xs text-gray-400">{getStatusText()}</span>
        </div>
        <button
          onClick={onExport}
          disabled={status !== 'running'}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
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
