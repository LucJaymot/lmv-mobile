import React from 'react';
import { View, Text, ViewStyle, TextStyle, Pressable } from 'react-native';
import { useTheme } from '@/theme/hooks';
import { createTextStyles } from '@/theme/styles';

export interface HeaderProps {
  /** Titre du header */
  title: string;
  /** Action à droite (bouton, icône, etc.) */
  rightAction?: React.ReactNode;
  /** Callback pour l'action à droite */
  onRightActionPress?: () => void;
  /** Sous-titre optionnel */
  subtitle?: string;
  /** Style personnalisé pour le conteneur */
  style?: ViewStyle;
  /** Style personnalisé pour le titre */
  titleStyle?: TextStyle;
  /** Accessibilité : label pour les lecteurs d'écran */
  accessibilityLabel?: string;
}

/**
 * Composant Header premium avec titre et action à droite
 * 
 * @example
 * ```tsx
 * <Header
 *   title="Mon Profil"
 *   rightAction={<Icon name="settings" />}
 *   onRightActionPress={handleSettings}
 * />
 * ```
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  rightAction,
  onRightActionPress,
  subtitle,
  style,
  titleStyle,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const textStyles = createTextStyles(theme);

  return (
    <View
      style={[
        {
          height: theme.componentTokens.header.height,
          paddingHorizontal: theme.componentTokens.header.paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.divider,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="header"
    >
      <View style={{ flex: 1, marginRight: theme.spacing[4] }}>
        <Text
          style={[
            textStyles.h3,
            {
              color: theme.colors.text,
            },
            titleStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              textStyles.bodySmall,
              {
                marginTop: theme.spacing[1],
                color: theme.colors.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightAction && (
        <Pressable
          onPress={onRightActionPress}
          disabled={!onRightActionPress}
          hitSlop={8}
          accessibilityRole={onRightActionPress ? 'button' : undefined}
          accessibilityLabel={typeof rightAction === 'string' ? rightAction : undefined}
        >
          {rightAction}
        </Pressable>
      )}
    </View>
  );
};

