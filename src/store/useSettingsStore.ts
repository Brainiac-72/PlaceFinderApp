import { create } from 'zustand';
import { Appearance } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemeMode;
  hasFinishedOnboarding: boolean;
  hasHydrated: boolean; // Tracking hydration status
  setTheme: (theme: ThemeMode) => void;
  setHasFinishedOnboarding: (finished: boolean) => void;
  getIsDark: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      hasFinishedOnboarding: false,
      hasHydrated: false,
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
        if (state) state.hasHydrated = true;
      },
    }
  )
);
