/**
 * Studio Settings Panel
 * Manages studio name, description, and avatar
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserSettings, UpdateSettingsInput } from '../../types';

interface StudioSettingsPanelProps {
  settings: UserSettings;
  onSave: (input: UpdateSettingsInput) => Promise<void>;
  isSaving: boolean;
}

export function StudioSettingsPanel({
  settings,
  onSave,
  isSaving,
}: StudioSettingsPanelProps) {
  const [studioName, setStudioName] = useState(settings.studio_name || '');
  const [studioDescription, setStudioDescription] = useState(
    settings.studio_description || ''
  );

  // Sync with settings prop changes
  useEffect(() => {
    setStudioName(settings.studio_name || '');
    setStudioDescription(settings.studio_description || '');
  }, [settings.studio_name, settings.studio_description]);

  const handleSave = () => {
    onSave({
      studio_name: studioName,
      studio_description: studioDescription || null,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Studio settings</h2>
      <p className="mt-1 text-gray-400">
        Manage your game development studio settings.
      </p>

      <div className="mt-8 space-y-8">
        {/* Studio Avatar */}
        <div>
          <h3 className="font-medium text-white">Studio avatar</h3>
          <p className="mt-1 text-sm text-gray-400">
            Set an avatar for your studio.
          </p>
          <div className="mt-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-2xl font-bold text-white">
            {studioName.charAt(0).toUpperCase() || 'S'}
          </div>
        </div>

        {/* Studio Name */}
        <div>
          <h3 className="font-medium text-white">Studio name</h3>
          <p className="mt-1 text-sm text-gray-400">
            Your studio name, as visible to others.
          </p>
          <div className="mt-3">
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              onBlur={handleSave}
              maxLength={100}
              className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white outline-none ring-violet-500 focus:border-transparent focus:ring-2"
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {studioName.length} / 100 characters
            </p>
          </div>
        </div>

        {/* Studio Description */}
        <div>
          <h3 className="font-medium text-white">Studio description</h3>
          <p className="mt-1 text-sm text-gray-400">
            A short description about your studio or team.
          </p>
          <div className="mt-3">
            <textarea
              value={studioDescription}
              onChange={(e) => setStudioDescription(e.target.value)}
              onBlur={handleSave}
              maxLength={500}
              rows={4}
              placeholder="Description"
              className="w-full max-w-md resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {studioDescription.length} / 500 characters
            </p>
          </div>
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
