import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme/hooks';

/**
 * Wrapper pour StatusBar qui s'adapte au thème
 */
export const StatusBarWrapper: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark' || theme.mode === 'trueBlack';

  return <StatusBar style={isDark ? 'light' : 'dark'} animated />;
};

