/**
 * Settings Modal
 * Main settings modal shell with sidebar navigation
 * Panel implementations are in separate files for maintainability
 */

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  X,
  Settings,
  CreditCard,
  BarChart3,
  User as UserIcon,
  FlaskConical,
  Github,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  getUserSettings,
  updateUserSettings,
  getUsageStats,
  deleteAccount,
} from '../lib/settingsService';
import type { UserSettings, UpdateSettingsInput, UsageStats } from '../types';
import {
  StudioSettingsPanel,
  PlansPanel,
  UsagePanel,
  AccountPanel,
  LabsPanel,
  GitHubPanel,
} from './settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

type SettingsTab = 'studio' | 'plans' | 'usage' | 'account' | 'labs' | 'github';

export function SettingsModal({ isOpen, onClose, user }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('studio');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadUsageStats();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    }
  };

  const handleSave = async (input: UpdateSettingsInput) => {
    try {
      setIsSaving(true);
      setError(null);
      const updated = await updateUserSettings(input);
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return;
    }
    if (
      !confirm(
        'This will permanently delete all your projects and data. Type "DELETE" in the next prompt to confirm.'
      )
    ) {
      return;
    }
    const confirmation = prompt('Type DELETE to confirm account deletion:');
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      await deleteAccount();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete account'
      );
    }
  };

  if (!isOpen) return null;

  const sidebarItems: Array<{
    section: string;
    items: Array<{ id: SettingsTab; label: string; icon: typeof Settings }>;
  }> = [
    {
      section: 'Studio',
      items: [
        { id: 'studio', label: 'Studio Settings', icon: Settings },
        { id: 'plans', label: 'Plans & credits', icon: CreditCard },
        { id: 'usage', label: 'Usage', icon: BarChart3 },
      ],
    },
    {
      section: 'Account',
      items: [
        {
          id: 'account',
          label: user.user_metadata?.full_name || 'Account',
          icon: UserIcon,
        },
        { id: 'labs', label: 'Labs', icon: FlaskConical },
      ],
    },
    {
      section: 'Connectors',
      items: [{ id: 'github', label: 'GitHub', icon: Github }],
    },
  ];

  const renderActivePanel = () => {
    if (!settings) return null;

    switch (activeTab) {
      case 'studio':
        return (
          <StudioSettingsPanel
            settings={settings}
            onSave={handleSave}
            isSaving={isSaving}
          />
        );
      case 'plans':
        return <PlansPanel usageStats={usageStats} />;
      case 'usage':
        return <UsagePanel usageStats={usageStats} />;
      case 'account':
        return (
          <AccountPanel
            user={user}
            settings={settings}
            onSave={handleSave}
            onDelete={handleDeleteAccount}
            isSaving={isSaving}
          />
        );
      case 'labs':
        return (
          <LabsPanel
            settings={settings}
            onSave={handleSave}
            isSaving={isSaving}
          />
        );
      case 'github':
        return <GitHubPanel settings={settings} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r border-gray-800 bg-gray-950 p-3">
          {sidebarItems.map((section) => (
            <div key={section.section} className="mb-4">
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                {section.section}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      activeTab === item.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
              <button
                onClick={loadSettings}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : (
            renderActivePanel()
          )}
        </main>
      </div>
    </div>
  );
}
