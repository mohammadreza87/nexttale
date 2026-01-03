/**
 * GitHub Connector Panel
 * Connect/disconnect GitHub account for project sync
 */

import { Github } from 'lucide-react';
import type { UserSettings } from '../../types';

interface GitHubPanelProps {
  settings: UserSettings;
}

export function GitHubPanel({ settings }: GitHubPanelProps) {
  const githubConnected = settings.connected_accounts?.github;

  const handleConnectGitHub = () => {
    // TODO: Implement GitHub OAuth flow
    alert(
      'GitHub integration coming soon! This will allow you to sync your projects with GitHub repositories.'
    );
  };

  const handleDisconnectGitHub = () => {
    // TODO: Implement disconnect
    console.log('Disconnect GitHub');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">GitHub</h2>
      <p className="mt-1 text-gray-400">
        Sync your project 2-way with GitHub to collaborate at source.
      </p>

      <div className="mt-8">
        <h3 className="font-medium text-white">Connected account</h3>
        <p className="mt-1 text-sm text-gray-400">
          Add your GitHub account to manage connected organizations.
        </p>

        {githubConnected ? (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5 text-white" />
              <div>
                <p className="text-sm font-medium text-white">
                  {githubConnected.username}
                </p>
                <p className="text-xs text-gray-400">
                  Connected{' '}
                  {new Date(githubConnected.connected_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnectGitHub}
              className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectGitHub}
            className="mt-4 flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white hover:bg-gray-700"
          >
            <Github className="h-5 w-5" />
            Connect GitHub
          </button>
        )}

        {/* GitHub Features Info */}
        <div className="mt-8 space-y-4">
          <h3 className="font-medium text-white">What you can do with GitHub</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-violet-400">•</span>
              <span>
                Push your game code directly to a GitHub repository
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400">•</span>
              <span>
                Pull changes from your repo to continue editing in Joyixir
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400">•</span>
              <span>
                Collaborate with team members using Git workflows
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400">•</span>
              <span>
                Deploy your game using GitHub Actions or other CI/CD
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
