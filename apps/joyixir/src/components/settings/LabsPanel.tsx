/**
 * Labs Panel
 * Experimental features toggles
 */

import { Loader2 } from 'lucide-react';
import type { UserSettings, UpdateSettingsInput } from '../../types';

interface LabsPanelProps {
  settings: UserSettings;
  onSave: (input: UpdateSettingsInput) => Promise<void>;
  isSaving: boolean;
}

export function LabsPanel({ settings, onSave, isSaving }: LabsPanelProps) {
  const handleToggle = (key: keyof UpdateSettingsInput, value: boolean) => {
    onSave({ [key]: value });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Labs</h2>
      <p className="mt-1 text-gray-400">
        These are experimental features that might be modified or removed.
      </p>

      <div className="mt-8 space-y-6">
        <LabFeature
          title="GitHub branch switching"
          description="Select the branch to make edits to in your GitHub repository."
          enabled={settings.labs_github_branch_switching}
          onToggle={(enabled) =>
            handleToggle('labs_github_branch_switching', enabled)
          }
        />

        {/* Placeholder for future lab features */}
        <div className="rounded-lg border border-dashed border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500">
            More experimental features coming soon...
          </p>
        </div>
      </div>

      {isSaving && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}

interface LabFeatureProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function LabFeature({
  title,
  description,
  enabled,
  onToggle,
}: LabFeatureProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? 'bg-violet-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
