import { Theme as NavigationTheme } from '@react-navigation/native';
import { Theme } from './theme';

/**
 * Mappe notre design system vers le thème React Navigation
 */
export const getNavigationTheme = (theme: Theme): NavigationTheme => {
  const isDark = theme.mode === 'dark' || theme.mode === 'trueBlack';

  return {
    dark: isDark,
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };
};

