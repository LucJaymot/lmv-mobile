import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, defaultTheme, trueBlackTheme, lightTheme, darkTheme } from './theme';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode || 'light'); // White-first par défaut
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger le mode depuis le stockage au démarrage
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['dark', 'light', 'trueBlack'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        } else {
          // Par défaut, white-first (light mode)
          setModeState('light');
        }
      } catch (error) {
        console.warn('Erreur lors du chargement du thème:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemeMode();
  }, [systemColorScheme]);

  // Sauvegarder le mode dans le stockage
  const setMode = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du thème:', error);
      setModeState(newMode);
    }
  };

  // Basculer entre light et dark
  const toggleMode = () => {
    if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('trueBlack');
    } else {
      setMode('light'); // Retour à white-first
    }
  };

  // Sélectionner le thème selon le mode
  const getTheme = (): Theme => {
    switch (mode) {
      case 'trueBlack':
        return trueBlackTheme;
      case 'dark':
        return darkTheme;
      case 'light':
      default:
        return defaultTheme; // White-first par défaut
    }
  };

  const theme = getTheme();

  // Ne pas rendre les enfants tant que le thème n'est pas chargé
  if (!isLoaded) {
    return null;
  }

  const value: ThemeContextValue = {
    theme,
    mode,
    setMode,
    toggleMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook pour accéder au thème
 * @throws Error si utilisé en dehors d'un ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
}

