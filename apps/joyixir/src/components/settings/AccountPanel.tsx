/**
 * Account Settings Panel
 * Manages user profile, preferences, and account settings
 */

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { ExternalLink, Volume2, VolumeX, Volume1, Loader2 } from 'lucide-react';
import type { UserSettings, UpdateSettingsInput } from '../../types';
import { Avatar } from '../Avatar';

interface AccountPanelProps {
  user: User;
  settings: UserSettings;
  onSave: (input: UpdateSettingsInput) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
}

export function AccountPanel({
  user,
  settings,
  onSave,
  onDelete,
  isSaving,
}: AccountPanelProps) {
  const [displayName, setDisplayName] = useState(settings.display_name || '');
  const [username, setUsername] = useState(settings.username || '');
  const [bio, setBio] = useState(settings.bio || '');
  const [location, setLocation] = useState(settings.location || '');
  const [websiteUrl, setWebsiteUrl] = useState(settings.website_url || '');
  const [hideProfilePicture, setHideProfilePicture] = useState(
    settings.hide_profile_picture
  );
  const [chatSuggestions, setChatSuggestions] = useState(
    settings.chat_suggestions
  );
  const [generationSound, setGenerationSound] = useState(
    settings.generation_sound
  );

  // Sync with settings prop changes
  useEffect(() => {
    setDisplayName(settings.display_name || '');
    setUsername(settings.username || '');
    setBio(settings.bio || '');
    setLocation(settings.location || '');
    setWebsiteUrl(settings.website_url || '');
    setHideProfilePicture(settings.hide_profile_picture);
    setChatSuggestions(settings.chat_suggestions);
    setGenerationSound(settings.generation_sound);
  }, [settings]);

  const handleFieldSave = (field: UpdateSettingsInput) => {
    onSave(field);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white">Account settings</h2>
      <p className="mt-1 text-gray-400">
        Personalize how others see and interact with you on Joyixir.
      </p>

      <div className="mt-8 space-y-8">
        {/* Avatar */}
        <SettingRow
          title="Your avatar"
          description="Your avatar is fetched from your linked identity provider."
        >
          <Avatar
            src={user.user_metadata?.avatar_url}
            name={user.user_metadata?.full_name || user.email}
            size="lg"
          />
        </SettingRow>

        {/* Username */}
        <SettingRow
          title="Username"
          description="Your public identifier and profile URL."
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => handleFieldSave({ username: username || null })}
            placeholder="username"
            className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
          />
          {username && (
            <a
              href={`/u/${username}`}
              className="mt-1 flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
            >
              joyixir.app/@{username}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </SettingRow>

        {/* Email (read-only) */}
        <SettingRow
          title="Email"
          description="Your email address associated with your account."
        >
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="w-full max-w-md cursor-not-allowed rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-gray-400"
          />
        </SettingRow>

        {/* Display Name */}
        <SettingRow
          title="Name"
          description="Your full name, as visible to others."
        >
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() =>
              handleFieldSave({ display_name: displayName || null })
            }
            placeholder="Your name"
            className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
          />
        </SettingRow>

        {/* Bio */}
        <SettingRow
          title="Description"
          description="A short description of yourself or your work."
        >
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onBlur={() => handleFieldSave({ bio: bio || null })}
            rows={3}
            placeholder="Tell us about yourself..."
            className="w-full max-w-md resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
          />
        </SettingRow>

        {/* Location */}
        <SettingRow title="Location" description="Where you're based.">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={() => handleFieldSave({ location: location || null })}
            placeholder="City, Country"
            className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
          />
        </SettingRow>

        {/* Website Link */}
        <SettingRow
          title="Link"
          description="Add a link to your personal website or portfolio."
        >
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            onBlur={() =>
              handleFieldSave({ website_url: websiteUrl || null })
            }
            placeholder="https://yoursite.com"
            className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
          />
        </SettingRow>

        {/* Toggle Settings */}
        <ToggleSetting
          title="Hide profile picture"
          description="Hide your profile picture from other users."
          checked={hideProfilePicture}
          onChange={(checked) => {
            setHideProfilePicture(checked);
            handleFieldSave({ hide_profile_picture: checked });
          }}
        />

        <ToggleSetting
          title="Chat suggestions"
          description="Show helpful suggestions in the chat interface."
          checked={chatSuggestions}
          onChange={(checked) => {
            setChatSuggestions(checked);
            handleFieldSave({ chat_suggestions: checked });
          }}
        />

        {/* Generation Complete Sound */}
        <div>
          <h3 className="font-medium text-white">Generation complete sound</h3>
          <p className="mt-1 text-sm text-gray-400">
            Plays a notification sound when generation is finished.
          </p>
          <div className="mt-3 space-y-2">
            {[
              { value: 'first', label: 'First generation', icon: Volume1 },
              { value: 'always', label: 'Always', icon: Volume2 },
              { value: 'never', label: 'Never', icon: VolumeX },
            ].map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3"
              >
                <input
                  type="radio"
                  name="generationSound"
                  value={option.value}
                  checked={generationSound === option.value}
                  onChange={() => {
                    setGenerationSound(
                      option.value as typeof generationSound
                    );
                    handleFieldSave({
                      generation_sound:
                        option.value as typeof generationSound,
                    });
                  }}
                  className="h-4 w-4 border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500"
                />
                <option.icon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Linked Accounts */}
        <div>
          <h3 className="font-medium text-white">Linked accounts</h3>
          <p className="mt-1 text-sm text-gray-400">
            Manage accounts linked for sign-in.
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
              <div className="flex items-center gap-3">
                <GoogleIcon />
                <div>
                  <p className="text-sm font-medium text-white">Google</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                Primary
              </span>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="border-t border-gray-800 pt-8">
          <h3 className="font-medium text-white">Delete account</h3>
          <p className="mt-1 text-sm text-gray-400">
            Permanently delete your Joyixir account. This cannot be undone.
          </p>
          <button
            onClick={onDelete}
            className="mt-3 rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-800"
          >
            Delete account
          </button>
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

// Helper Components

interface SettingRowProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ title, description, children }: SettingRowProps) {
  return (
    <div>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

interface ToggleSettingProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSetting({
  title,
  description,
  checked,
  onChange,
}: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-violet-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
