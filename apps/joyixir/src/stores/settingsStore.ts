/**
 * Settings store using Zustand
 * Manages user settings with caching and persistence
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserSettings, UsageStats, UpdateSettingsInput } from '../types';
import {
  getUserSettings as fetchUserSettings,
  updateUserSettings as updateSettings,
  getUsageStats as fetchUsageStats,
} from '../lib/settingsService';

interface SettingsState {
  // Data
  settings: UserSettings | null;
  usageStats: UsageStats | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Cache management
  lastFetched: number | null;
  cacheTimeout: number; // milliseconds

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (input: UpdateSettingsInput) => Promise<void>;
  fetchUsageStats: () => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
}

const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      settings: null,
      usageStats: null,
      isLoading: false,
      isSaving: false,
      error: null,
      lastFetched: null,
      cacheTimeout: CACHE_TIMEOUT,

      fetchSettings: async () => {
        const { lastFetched, cacheTimeout, settings, isLoading } = get();

        // Return cached data if still valid
        if (
          settings &&
          lastFetched &&
          Date.now() - lastFetched < cacheTimeout
        ) {
          return;
        }

        // Prevent duplicate fetches
        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const data = await fetchUserSettings();
          set({
            settings: data as UserSettings,
            lastFetched: Date.now(),
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load settings',
            isLoading: false,
          });
        }
      },

      updateSettings: async (input) => {
        set({ isSaving: true, error: null });

        try {
          const data = await updateSettings(input);
          set({
            settings: data as UserSettings,
            isSaving: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to save settings',
            isSaving: false,
          });
          throw err;
        }
      },

      fetchUsageStats: async () => {
        try {
          const stats = await fetchUsageStats();
          set({
            usageStats: {
              ...stats,
              totalCredits: 5,
              dailyAverage: 0,
              daysEdited: 1,
            },
          });
        } catch (err) {
          console.error('Failed to fetch usage stats:', err);
        }
      },

      clearError: () => set({ error: null }),

      invalidateCache: () => set({ lastFetched: null }),
    }),
    { name: 'SettingsStore' }
  )
);

// Selectors
export const selectSettings = (state: SettingsState) => state.settings;
export const selectUsageStats = (state: SettingsState) => state.usageStats;
export const selectIsLoading = (state: SettingsState) => state.isLoading;
export const selectIsSaving = (state: SettingsState) => state.isSaving;
