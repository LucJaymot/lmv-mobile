import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  ViewStyle,
  TextStyle,
  TextInputProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/theme/hooks';
import { createInputStyles, createTextStyles } from '@/theme/styles';
import { colors } from '@/styles/commonStyles';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Label au-dessus de l'input */
  label?: string;
  /** Texte d'aide sous l'input */
  helperText?: string;
  /** Message d'erreur (remplace helperText si présent) */
  error?: string;
  /** Icône optionnelle à gauche */
  leftIcon?: React.ReactNode;
  /** Icône optionnelle à droite */
  rightIcon?: React.ReactNode;
  /** Style personnalisé pour le conteneur */
  containerStyle?: ViewStyle;
  /** Style personnalisé pour l'input */
  inputStyle?: TextStyle;
  /** Taille de l'input */
  size?: 'sm' | 'md' | 'lg';
  /** État désactivé */
  disabled?: boolean;
  /** Forcer l'utilisation de couleurs statiques (pour pages d'authentification) */
  forceStaticColors?: boolean;
}

/**
 * Composant Input premium avec label, erreur et icônes
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="votre@email.com"
 *   error={errors.email}
 * />
 * ```
 */
export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  size = 'md',
  disabled = false,
  forceStaticColors = false,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const inputStyles = createInputStyles(theme);
  const textStyles = createTextStyles(theme);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const displayText = error || helperText;

  // Hauteur selon la taille
  const getHeight = (): number => {
    if (forceStaticColors) {
      // Hauteurs statiques pour les pages d'authentification
      switch (size) {
        case 'sm':
          return 40;
        case 'lg':
          return 56;
        default:
          return 48;
      }
    }
    switch (size) {
      case 'sm':
        return theme.componentTokens.input.height.sm;
      case 'lg':
        return theme.componentTokens.input.height.lg;
      default:
        return theme.componentTokens.input.height.md;
    }
  };

  // Styles statiques pour les pages d'authentification (calculés dynamiquement)
  const getStaticInputStyle = (): TextStyle => {
    if (!forceStaticColors) return {};
    return {
      backgroundColor: colors.card,
      borderColor: hasError ? colors.error : (isFocused ? colors.primary : colors.border),
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 16,
      color: colors.text,
      fontSize: 16,
    };
  };

  const staticLabelStyle = forceStaticColors ? {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  } : {};

  const staticErrorStyle = forceStaticColors ? {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 6,
  } : {};

  const staticHelperStyle = forceStaticColors ? {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  } : {};

  return (
    <View style={[inputStyles.container, { width: '100%' }, containerStyle]}>
      {label && (
        <Text style={[
          forceStaticColors ? staticLabelStyle : [inputStyles.label, textStyles.label],
        ]}>
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {leftIcon ? (
          <View style={{ 
            width: 20,
            marginRight: forceStaticColors ? 12 : theme.spacing[2], 
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {leftIcon}
          </View>
        ) : (
          <View style={{ width: 0 }} />
        )}

        <TextInput
          {...textInputProps}
          style={[
            forceStaticColors ? getStaticInputStyle() : inputStyles.input,
            {
              height: getHeight(),
              flex: 1,
              minWidth: 0,
            },
            !forceStaticColors && isFocused && !hasError ? inputStyles.inputFocused : null,
            !forceStaticColors && hasError ? inputStyles.inputError : null,
            !forceStaticColors && disabled ? inputStyles.inputDisabled : null,
            inputStyle,
            // Réappliquer les styles statiques après inputStyle pour garantir qu'ils ne sont pas écrasés
            forceStaticColors ? getStaticInputStyle() : null,
          ] as any}
          placeholderTextColor={forceStaticColors ? colors.textSecondary : theme.colors.textMuted}
          editable={!disabled}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          accessibilityLabel={label || textInputProps.accessibilityLabel}
          accessibilityState={{ disabled }}
        />

        {rightIcon ? (
          <View style={{ 
            width: 20,
            marginLeft: forceStaticColors ? 12 : theme.spacing[2], 
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {rightIcon}
          </View>
        ) : (
          <View style={{ width: 0 }} />
        )}
      </View>

      {displayText && (
        <Text
          style={[
            forceStaticColors 
              ? (hasError ? staticErrorStyle : staticHelperStyle)
              : (hasError ? inputStyles.errorText : inputStyles.helperText),
            !forceStaticColors && hasError && textStyles.error,
          ]}
        >
          {displayText}
        </Text>
      )}
    </View>
  );
};

