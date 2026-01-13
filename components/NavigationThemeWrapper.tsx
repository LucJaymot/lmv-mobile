import React from 'react';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useTheme } from '@/theme/hooks';
import { getNavigationTheme } from '@/theme/navigationTheme';

/**
 * Wrapper pour synchroniser React Navigation avec notre design system
 */
export const NavigationThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const navigationTheme = getNavigationTheme(theme);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  );
};

