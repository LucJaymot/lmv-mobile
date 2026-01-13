import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableStateCallbackType,
} from 'react-native';
import { useTheme } from '@/theme/hooks';
import { createButtonStyles, createTextStyles } from '@/theme/styles';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /** Texte ou contenu du bouton */
  children: React.ReactNode;
  /** Variant du bouton */
  variant?: ButtonVariant;
  /** Taille du bouton */
  size?: ButtonSize;
  /** État désactivé */
  disabled?: boolean;
  /** État de chargement */
  loading?: boolean;
  /** Callback au clic */
  onPress?: () => void;
  /** Style personnalisé pour le conteneur */
  style?: ViewStyle;
  /** Style personnalisé pour le texte */
  textStyle?: TextStyle;
  /** Accessibilité : label pour les lecteurs d'écran */
  accessibilityLabel?: string;
  /** Accessibilité : hint pour les lecteurs d'écran */
  accessibilityHint?: string;
}

/**
 * Composant Button premium avec variants et états
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onPress={handlePress}>
 *   Valider
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const buttonStyles = createButtonStyles(theme);
  const textStyles = createTextStyles(theme);

  // Styles de base selon le variant
  const getBaseStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return buttonStyles.primary;
      case 'secondary':
        return buttonStyles.secondary;
      case 'ghost':
        return buttonStyles.ghost;
      case 'text':
        return buttonStyles.text;
      default:
        return buttonStyles.primary;
    }
  };

  // Styles selon la taille
  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return buttonStyles.small;
      case 'lg':
        return buttonStyles.large;
      default:
        return {};
    }
  };

  // Styles du texte selon le variant
  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...textStyles.bodyMedium,
    };

    switch (variant) {
      case 'primary':
      case 'secondary':
        // Texte blanc sur fond coloré pour contraste optimal
        return {
          ...baseTextStyle,
          color: '#FFFFFF',
        };
      case 'ghost':
      case 'text':
        return {
          ...baseTextStyle,
          color: theme.colors.accent,
        };
      default:
        return baseTextStyle;
    }
  };

  // Gestion des états pressés
  const getPressedStyle = ({ pressed }: PressableStateCallbackType): ViewStyle => {
    if (disabled || loading) return {};

    switch (variant) {
      case 'primary':
        return pressed ? buttonStyles.primaryPressed : {};
      case 'secondary':
        return pressed ? buttonStyles.secondaryPressed : {};
      case 'ghost':
        return pressed ? buttonStyles.ghostPressed : {};
      case 'text':
        return pressed ? buttonStyles.textPressed : {};
      default:
        return {};
    }
  };

  // Style désactivé
  const getDisabledStyle = (): ViewStyle => {
    if (!disabled && !loading) return {};

    switch (variant) {
      case 'primary':
        return buttonStyles.primaryDisabled;
      case 'secondary':
        return buttonStyles.secondaryDisabled;
      case 'ghost':
        return buttonStyles.ghostDisabled;
      case 'text':
        return buttonStyles.textDisabled;
      default:
        return {};
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        getBaseStyle(),
        getSizeStyle(),
        getPressedStyle({ pressed } as PressableStateCallbackType),
        getDisabledStyle(),
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
      hitSlop={8} // Zone de toucher agrandie pour meilleure accessibilité
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : theme.colors.accent}
        />
      ) : typeof children === 'string' ? (
        <Text style={[getTextStyle(), textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
};

