import { create } from 'zustand';
import { Appearance } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** The possible theme modes chosen by the user. */
type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemeMode;
  hasFinishedOnboarding: boolean;
  hasHydrated: boolean; // Tracking hydration status
  setHasHydrated: (hydrated: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setHasFinishedOnboarding: (finished: boolean) => void;
  getIsDark: () => boolean;
}

/**
 * Global Zustand store for managing app-wide settings (e.g., Theme preference, Onboarding status).
 * Persists data to local AsyncStorage to remember settings across sessions.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      hasFinishedOnboarding: false,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setTheme: (theme) => set({ theme }),
      setHasFinishedOnboarding: (hasFinishedOnboarding) => set({ hasFinishedOnboarding }),
      getIsDark: () => {
        const { theme } = get();
        if (theme === 'system') {
          return Appearance.getColorScheme() === 'dark';
        }
        return theme === 'dark';
      }
    }),
    {
      name: 'sfa-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
