import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '@/theme/theme';
import { createTextStyles, createButtonStyles, createCardStyles, createInputStyles } from '@/theme/styles';

/**
 * Styles communs qui utilisent le thème dynamique
 * 
 * Utilisation :
 * ```tsx
 * import { useTheme } from '@/theme/hooks';
 * import { getThemeStyles } from '@/styles/themeStyles';
 * 
 * const { theme } = useTheme();
 * const styles = getThemeStyles(theme);
 * ```
 */
export const getThemeStyles = (theme: Theme) => {
  const textStyles = createTextStyles(theme);
  const buttonStyles = createButtonStyles(theme);
  const cardStyles = createCardStyles(theme);
  const inputStyles = createInputStyles(theme);

  return StyleSheet.create({
    // Containers
    wrapper: {
      backgroundColor: theme.colors.background,
      width: '100%',
      height: '100%',
    } as ViewStyle,
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      width: '100%',
      height: '100%',
    } as ViewStyle,
    content: {
      flex: 1,
      maxWidth: 800,
      width: '100%',
      alignSelf: 'center',
    } as ViewStyle,

    // Sections
    section: {
      width: '100%',
      paddingHorizontal: theme.spacing[5],
      marginBottom: theme.spacing[4],
    } as ViewStyle,

    // Cards (compatibilité avec ancien code)
    card: {
      ...cardStyles.surface,
      marginVertical: theme.spacing[2],
      width: '100%',
    } as ViewStyle,

    // Badges
    badge: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[1],
      borderRadius: theme.radius.full,
      alignSelf: 'flex-start',
    } as ViewStyle,
    badgeText: {
      ...textStyles.bodyXSmall,
      fontWeight: theme.typography.fontWeight.semibold,
    } as TextStyle,

    // Legacy button text styles (pour compatibilité)
    buttonText: {
      ...textStyles.bodyMedium,
      color: theme.colors.text,
    } as TextStyle,
    buttonTextOutline: {
      ...textStyles.bodyMedium,
      color: theme.colors.accent,
    } as TextStyle,

    // Export des styles helpers du thème
    text: textStyles,
    button: buttonStyles,
    card: cardStyles,
    input: inputStyles,
  });
};

/**
 * Helper pour créer des styles personnalisés avec le thème
 */
export const createStylesWithTheme = (theme: Theme) => {
  return <T extends Record<string, ViewStyle | TextStyle>>(styles: T): T => {
    return StyleSheet.create(styles);
  };
};

