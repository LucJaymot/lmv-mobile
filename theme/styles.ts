import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Theme } from './theme';

/**
 * Crée des styles typographiques réutilisables
 */
export const createTextStyles = (theme: Theme) => {
  const { typography, colors } = theme;

  return StyleSheet.create({
    // Titres
    h1: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight['3xl'],
      color: colors.text,
      letterSpacing: typography.letterSpacing.tight,
    } as TextStyle,
    h2: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight['2xl'],
      color: colors.text,
      letterSpacing: typography.letterSpacing.tight,
    } as TextStyle,
    h3: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.xl,
      color: colors.text,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    h4: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.lg,
      color: colors.text,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,

    // Corps de texte
    body: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.base,
      color: colors.text,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    bodyMedium: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.base,
      color: colors.text,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    bodySmall: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.sm,
      color: colors.textMuted,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    bodyXSmall: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.xs,
      color: colors.textMuted,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,

    // Texte accent (liens, CTA)
    accent: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.base,
      color: colors.accent,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    accentSmall: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.sm,
      color: colors.accent,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,

    // Labels
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.sm,
      color: colors.text,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    labelSmall: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.xs,
      color: colors.textMuted,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,

    // États
    error: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.sm,
      color: colors.error,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    success: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.sm,
      color: colors.success,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    warning: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.sm,
      color: colors.warning,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
    disabled: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.base,
      color: colors.disabledText,
      letterSpacing: typography.letterSpacing.normal,
    } as TextStyle,
  });
};

/**
 * Crée des styles de boutons réutilisables
 */
export const createButtonStyles = (theme: Theme) => {
  const { colors, spacing, radius, componentTokens } = theme;
  const { button } = componentTokens;

  return StyleSheet.create({
    // Primary - Utilise accent (couleur de marque) avec texte blanc
    primary: {
      backgroundColor: colors.accent, // Couleur de marque pour CTA
      height: button.height.md,
      paddingHorizontal: button.paddingHorizontal.md,
      borderRadius: button.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: button.minWidth,
    } as ViewStyle,
    primaryPressed: {
      backgroundColor: colors.accentDark,
      opacity: 0.9,
    } as ViewStyle,
    primaryDisabled: {
      backgroundColor: colors.disabled,
      opacity: 0.5,
    } as ViewStyle,

    // Secondary - Utilise la couleur secondary de la charte (#000022)
    secondary: {
      backgroundColor: colors.secondary, // #000022 (couleur de marque exacte)
      height: button.height.md,
      paddingHorizontal: button.paddingHorizontal.md,
      borderRadius: button.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: button.minWidth,
    } as ViewStyle,
    secondaryPressed: {
      backgroundColor: colors.secondaryDark || colors.secondary, // Nuance plus foncée (#000022 plus foncé)
      opacity: 0.9,
    } as ViewStyle,
    secondaryDisabled: {
      backgroundColor: colors.disabled,
      opacity: 0.5,
    } as ViewStyle,

    // Ghost (transparent avec bordure)
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      height: button.height.md,
      paddingHorizontal: button.paddingHorizontal.md,
      borderRadius: button.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: button.minWidth,
    } as ViewStyle,
    ghostPressed: {
      backgroundColor: colors.pressed,
      borderColor: colors.accent,
    } as ViewStyle,
    ghostDisabled: {
      borderColor: colors.disabled,
      opacity: 0.5,
    } as ViewStyle,

    // Text (sans bordure)
    text: {
      backgroundColor: 'transparent',
      height: button.height.md,
      paddingHorizontal: button.paddingHorizontal.md,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: button.minWidth,
    } as ViewStyle,
    textPressed: {
      backgroundColor: colors.pressed,
    } as ViewStyle,
    textDisabled: {
      opacity: 0.5,
    } as ViewStyle,

    // Tailles
    small: {
      height: button.height.sm,
      paddingHorizontal: button.paddingHorizontal.sm,
    } as ViewStyle,
    large: {
      height: button.height.lg,
      paddingHorizontal: button.paddingHorizontal.lg,
    } as ViewStyle,
  });
};

/**
 * Crée des styles de cartes réutilisables
 */
export const createCardStyles = (theme: Theme) => {
  const { colors, spacing, radius, shadows, componentTokens } = theme;
  const { card } = componentTokens;

  return StyleSheet.create({
    // Surface (fond de base) - Blanc avec bordure très claire
    surface: {
      backgroundColor: colors.surface, // #FAFAFA (blanc cassé)
      borderRadius: card.borderRadius,
      padding: card.padding,
      borderWidth: 1, // Ligne fine
      borderColor: colors.border, // #E5E7EB (gris très clair)
    } as ViewStyle,

    // Elevated (avec ombre très subtile) - Blanc pur
    elevated: {
      backgroundColor: colors.elevated, // #FFFFFF (blanc pur)
      borderRadius: card.borderRadius,
      padding: card.padding,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm, // Ombre très subtile
    } as ViewStyle,

    // Compact (moins de padding)
    compact: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing[3],
      borderWidth: card.borderWidth,
      borderColor: colors.border,
    } as ViewStyle,
  });
};

/**
 * Crée des styles d'inputs réutilisables
 */
export const createInputStyles = (theme: Theme) => {
  const { colors, spacing, radius, typography, componentTokens } = theme;
  const { input } = componentTokens;

  return StyleSheet.create({
    // Container
    container: {
      marginBottom: spacing[4],
    } as ViewStyle,

    // Label
    label: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: colors.text,
      marginBottom: spacing[2],
    } as TextStyle,

    // Input - Fond adaptatif avec bordure claire
    input: {
      backgroundColor: colors.elevated, // Fond adaptatif selon le thème
      borderWidth: 1, // Ligne fine
      borderColor: colors.border, // #E5E7EB
      borderRadius: input.borderRadius,
      paddingHorizontal: input.paddingHorizontal,
      height: input.height.md,
      fontSize: typography.fontSize.base,
      color: colors.text, // #040F16 (noir doux)
    } as TextStyle,

    // Input avec erreur
    inputError: {
      borderColor: colors.error,
    } as ViewStyle,

    // Input disabled
    inputDisabled: {
      backgroundColor: colors.disabled,
      borderColor: colors.border,
      opacity: 0.5,
    } as ViewStyle,

    // Input focused - Bordure accent (couleur de marque)
    inputFocused: {
      borderColor: colors.accent, // #002B39 (couleur de marque)
      borderWidth: 1.5, // Légèrement plus épais au focus
    } as ViewStyle,

    // Message d'erreur
    errorText: {
      fontSize: typography.fontSize.xs,
      color: colors.error,
      marginTop: spacing[1],
    } as TextStyle,

    // Helper text
    helperText: {
      fontSize: typography.fontSize.xs,
      color: colors.textMuted,
      marginTop: spacing[1],
    } as TextStyle,
  });
};

/**
 * Helper pour créer des styles avec le thème
 * Utilisation : const styles = createStyles(theme)({ ... })
 */
export const createStyles = (theme: Theme) => {
  return <T extends Record<string, ViewStyle | TextStyle>>(styles: T): T => {
    return StyleSheet.create(styles);
  };
};

/**
 * Export de tous les styles helpers
 */
export const getThemeStyles = (theme: Theme) => ({
  text: createTextStyles(theme),
  button: createButtonStyles(theme),
  card: createCardStyles(theme),
  input: createInputStyles(theme),
  create: createStyles(theme),
});

