import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/hooks';
import { createCardStyles } from '@/theme/styles';

export type CardVariant = 'surface' | 'elevated' | 'compact';

export interface CardProps {
  /** Contenu de la carte */
  children: React.ReactNode;
  /** Variant de la carte */
  variant?: CardVariant;
  /** Style personnalisé */
  style?: ViewStyle;
  /** Padding personnalisé (override le padding par défaut) */
  padding?: number;
  /** Callback au clic (rend la carte pressable) */
  onPress?: () => void;
  /** Accessibilité : label pour les lecteurs d'écran */
  accessibilityLabel?: string;
}

/**
 * Composant Card premium avec variants
 * 
 * @example
 * ```tsx
 * <Card variant="elevated">
 *   <Text>Contenu de la carte</Text>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  style,
  padding,
  onPress,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const cardStyles = createCardStyles(theme);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'surface':
        return cardStyles.surface;
      case 'elevated':
        return cardStyles.elevated;
      case 'compact':
        return cardStyles.compact;
      default:
        return cardStyles.surface;
    }
  };

  const cardStyle: ViewStyle = [
    getVariantStyle(),
    padding !== undefined && { padding },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={cardStyle}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
};

