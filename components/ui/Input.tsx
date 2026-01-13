import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '@/theme/hooks';
import { createInputStyles, createTextStyles } from '@/theme/styles';

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
    switch (size) {
      case 'sm':
        return theme.componentTokens.input.height.sm;
      case 'lg':
        return theme.componentTokens.input.height.lg;
      default:
        return theme.componentTokens.input.height.md;
    }
  };

  return (
    <View style={[inputStyles.container, containerStyle]}>
      {label && (
        <Text style={[inputStyles.label, textStyles.label]}>
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {leftIcon && (
          <View style={{ marginRight: theme.spacing[2], justifyContent: 'center' }}>
            {leftIcon}
          </View>
        )}

        <TextInput
          {...textInputProps}
          style={[
            inputStyles.input,
            {
              height: getHeight(),
              flex: 1,
            },
            isFocused && !hasError && inputStyles.inputFocused,
            hasError && inputStyles.inputError,
            disabled && inputStyles.inputDisabled,
            inputStyle,
          ]}
          placeholderTextColor={theme.colors.textMuted}
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

        {rightIcon && (
          <View style={{ marginLeft: theme.spacing[2], justifyContent: 'center' }}>
            {rightIcon}
          </View>
        )}
      </View>

      {displayText && (
        <Text
          style={[
            hasError ? inputStyles.errorText : inputStyles.helperText,
            hasError ? textStyles.error : {},
          ]}
        >
          {displayText}
        </Text>
      )}
    </View>
  );
};

