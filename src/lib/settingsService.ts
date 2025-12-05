const SETTINGS_KEY = 'mina_user_settings';

export interface UserSettings {
  autoNarration: boolean;
}

const defaultSettings: UserSettings = {
  autoNarration: true, // Enabled by default
};

export function getUserSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error reading user settings:', error);
  }
  return defaultSettings;
}

export function saveUserSettings(settings: Partial<UserSettings>): void {
  try {
    const current = getUserSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving user settings:', error);
  }
}

export function getAutoNarration(): boolean {
  return getUserSettings().autoNarration;
}

export function setAutoNarration(enabled: boolean): void {
  saveUserSettings({ autoNarration: enabled });
}
