import { useSettingsStore } from '../store/useSettingsStore';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';

export function useThemeColor() {
  const settingsTheme = useSettingsStore(state => state.theme);
  const systemTheme = useColorScheme() ?? 'light';
  
  const currentTheme: 'light' | 'dark' = settingsTheme === 'system' ? (systemTheme === 'dark' ? 'dark' : 'light') : settingsTheme;
  
  return {
    colors: Colors[currentTheme],
    isDark: currentTheme === 'dark'
  };
}
