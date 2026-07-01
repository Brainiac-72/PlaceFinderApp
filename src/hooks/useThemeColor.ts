import { useSettingsStore } from '../store/useSettingsStore';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';

/**
 * Advanced theme hook that integrates with the user's explicit app settings.
 * It checks the global Zustand store (`useSettingsStore`) to see if the user forced 
 * 'light' or 'dark' mode, falling back to the `systemTheme` if set to 'system'.
 * 
 * @returns An object containing the active `colors` palette and a boolean `isDark` flag.
 */
export function useThemeColor() {
  const settingsTheme = useSettingsStore(state => state.theme);
  const systemTheme = useColorScheme() ?? 'light';
  
  // Resolve 'system' preference into concrete 'light' or 'dark'
  const currentTheme: 'light' | 'dark' = settingsTheme === 'system' ? (systemTheme === 'dark' ? 'dark' : 'light') : settingsTheme;
  
  return {
    colors: Colors[currentTheme],
    isDark: currentTheme === 'dark'
  };
}
