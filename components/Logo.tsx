import React, { useMemo, memo } from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';
import { useColorScheme } from 'react-native';
import { useTheme } from '@/theme/hooks';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  /** Taille du logo */
  size?: LogoSize;
  /** Style personnalisé pour le conteneur */
  containerStyle?: ViewStyle;
  /** Style personnalisé pour l'image */
  imageStyle?: ImageStyle;
  /** Afficher un fond circulaire (pour écrans blancs) */
  withCircleBackground?: boolean;
  /** Forcer l'utilisation de couleurs statiques (pour pages d'authentification) */
  forceStaticColors?: boolean;
}

const sizeMap: Record<LogoSize, number> = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 160,
};

/**
 * Composant Logo pour afficher le logo LMV
 * 
 * @example
 * ```tsx
 * <Logo size="lg" withCircleBackground />
 * ```
 */
const LogoComponent: React.FC<LogoProps> = ({
  size = 'md',
  containerStyle,
  imageStyle,
  withCircleBackground = false,
  forceStaticColors = false,
}) => {
  const { theme, mode } = useTheme();
  const systemColorScheme = useColorScheme();
  const logoSize = sizeMap[size];
  // En mode light, toujours utiliser logo_LMV.png (noir)
  // En mode dark ou trueBlack, utiliser logo_LMV_blanc.png (blanc)
  // Ne pas utiliser systemColorScheme pour éviter les conflits avec le mode choisi dans l'app
  const isDark =
    !forceStaticColors &&
    (mode === 'dark' || mode === 'trueBlack');

  // Mémoriser les sources d'images pour éviter les re-renders
  const logoSource = useMemo(() => {
    return isDark
      ? require('@/assets/images/logo_LMV_blanc.png')
      : require('@/assets/images/logo_LMV.png');
  }, [isDark]);

  const logoImage = (
    <Image
      source={logoSource}
      style={[
        {
          width: logoSize,
          height: logoSize,
          resizeMode: 'contain',
        },
        imageStyle,
      ]}
      accessibilityLabel="Logo LMV - Lave ma voiture"
      accessibilityRole="image"
      // Optimisations pour le chargement
      fadeDuration={0} // Pas de fade pour un chargement instantané
    />
  );

  if (withCircleBackground) {
    // Utiliser une couleur statique blanche si forceStaticColors est true (pour pages d'authentification)
    const circleBackgroundColor = forceStaticColors ? '#FFFFFF' : theme.colors.surface;
    
    return (
      <View
        style={[
          styles.circleContainer,
          {
            width: logoSize + 32,
            height: logoSize + 32,
            borderRadius: (logoSize + 32) / 2,
            backgroundColor: circleBackgroundColor,
            // Ombre très subtile pour white-first
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
          },
          containerStyle,
        ]}
      >
        {logoImage}
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {logoImage}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Mémoriser le composant pour éviter les re-renders inutiles
export const Logo = memo(LogoComponent);
