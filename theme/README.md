# Design System - Thème Premium Dark

## Vue d'ensemble

Design system moderne, épuré et premium avec une ambiance dark élégante, basé sur une palette de couleurs sophistiquée centrée sur des bleus nuit profonds.

## Palette de couleurs

### Couleurs de base

- **#000022** - Bleu nuit profond (Midnight Blue)
- **#002B39** - Bleu-vert pétrole (Petrol Blue)  
- **#040F16** - Noir bleuté / Charbon (Charcoal Blue)

### Couleur accent

- **#00A8B5** - Cyan pétrole vif (dérivé de #002B39, plus vive)
  - Utilisée pour les CTA, toggles, liens actifs

### Couleurs neutres

- **#F5F5F7** - Blanc cassé (Off White) - Texte principal
- **#6B7A8A** - Gris bleuté (Blue Gray) - Texte secondaire

### Rôles de couleurs (Dark Mode)

```typescript
{
  // Backgrounds
  background: '#040F16',      // Fond principal
  surface: '#000022',         // Surfaces (cartes, inputs)
  elevated: '#000022...',      // Surfaces élevées (avec ombre)
  overlay: 'rgba(0,0,0,0.7)', // Overlays modaux

  // Primary & Secondary
  primary: '#002B39',         // Couleur primaire
  secondary: '#000022',       // Couleur secondaire

  // Accent
  accent: '#00A8B5',          // CTA, liens, toggles

  // Text
  text: '#F5F5F7',            // Texte principal
  textMuted: '#6B7A8A',       // Texte secondaire

  // Borders & Dividers
  border: '#002B39...',       // Bordures subtiles
  divider: '#000022...',      // Séparateurs

  // Sémantiques
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
}
```

## Typographie

### Échelle de tailles

- `xs`: 12px
- `sm`: 14px
- `base`: 16px
- `lg`: 18px
- `xl`: 20px
- `2xl`: 24px
- `3xl`: 30px
- `4xl`: 36px
- `5xl`: 48px

### Poids de police

- `regular`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700

### Line heights

Ratio de 1.5 pour une lisibilité optimale sur fond sombre.

## Spacing

Échelle basée sur 4px :

```typescript
{
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
}
```

## Border Radius

```typescript
{
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
}
```

## Shadows

Ombres très subtiles pour le dark mode :

- `sm`: Ombre légère (elevation: 2)
- `base`: Ombre standard (elevation: 4)
- `md`: Ombre moyenne (elevation: 6)
- `lg`: Ombre grande (elevation: 8)

## Modes de thème

### Dark Mode (par défaut)
Thème principal avec fond charbon et surfaces bleu nuit.

### True Black Mode (OLED)
Fond noir pur (#000000) pour économiser la batterie sur écrans OLED.

### Light Mode (structure prête)
Structure préparée pour un futur mode clair (non implémenté complètement).

## Utilisation

### ThemeProvider

Enveloppez votre application avec le `ThemeProvider` :

```tsx
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      {/* Votre app */}
    </ThemeProvider>
  );
}
```

### Hook useTheme

Accédez au thème dans vos composants :

```tsx
import { useTheme } from '@/theme/hooks';

function MyComponent() {
  const { theme, mode, setMode, toggleMode } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello</Text>
    </View>
  );
}
```

### Styles helpers

Utilisez les helpers de styles pour créer des styles typographiques et de composants :

```tsx
import { getThemeStyles } from '@/theme/styles';
import { useTheme } from '@/theme/hooks';

function MyComponent() {
  const { theme } = useTheme();
  const styles = getThemeStyles(theme);
  
  return (
    <Text style={styles.text.h1}>Titre</Text>
    <Pressable style={styles.button.primary}>
      <Text style={styles.text.bodyMedium}>Bouton</Text>
    </Pressable>
  );
}
```

## Composants UI

Voir la documentation dans `/components/ui/` pour :
- `Button` - Boutons avec variants (primary, secondary, ghost, text)
- `Card` - Cartes avec variants (surface, elevated, compact)
- `Input` - Inputs avec label, erreur, icônes
- `Header` - Headers avec titre et action à droite

## Accessibilité

- Contrastes AA/AAA respectés pour le texte sur fond sombre
- Tailles de toucher minimales (44x44px recommandé)
- Support des lecteurs d'écran avec `accessibilityLabel` et `accessibilityHint`
- `hitSlop` agrandi pour meilleure accessibilité tactile

