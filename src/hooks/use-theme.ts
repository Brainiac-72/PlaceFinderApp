/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Hook to retrieve the current color theme configuration (light/dark values).
 * Uses the system color scheme to return the appropriate set of colors defined in constants/theme.
 * 
 * @returns The Colors object for the current active theme.
 */
export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme ?? 'light';

  return Colors[theme];
}
