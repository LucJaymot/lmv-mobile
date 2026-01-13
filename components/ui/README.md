# Composants UI - Design System

## Vue d'ensemble

Composants UI premium prêts à l'emploi, entièrement intégrés au design system dark.

## Installation

Les composants sont déjà disponibles dans `/components/ui/`. Importez-les directement :

```tsx
import { Button, Card, Input, Header } from '@/components/ui';
```

## Composants

### Button

Bouton avec variants et états complets.

#### Variants

- `primary` - Bouton principal avec couleur accent
- `secondary` - Bouton secondaire avec couleur primaire
- `ghost` - Bouton transparent avec bordure
- `text` - Bouton texte uniquement

#### Tailles

- `sm` - 36px de hauteur
- `md` - 44px de hauteur (par défaut)
- `lg` - 52px de hauteur

#### Exemple

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" onPress={handlePress} loading={isLoading}>
  Valider
</Button>

<Button variant="ghost" size="sm" onPress={handleCancel}>
  Annuler
</Button>

<Button variant="primary" disabled>
  Désactivé
</Button>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `children` | `ReactNode` | - | Contenu du bouton |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'text'` | `'primary'` | Variant du bouton |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille du bouton |
| `disabled` | `boolean` | `false` | État désactivé |
| `loading` | `boolean` | `false` | État de chargement |
| `onPress` | `() => void` | - | Callback au clic |
| `style` | `ViewStyle` | - | Style personnalisé |
| `textStyle` | `TextStyle` | - | Style texte personnalisé |
| `accessibilityLabel` | `string` | - | Label accessibilité |
| `accessibilityHint` | `string` | - | Hint accessibilité |

---

### Card

Carte avec variants pour différentes élévations.

#### Variants

- `surface` - Carte de base avec fond surface
- `elevated` - Carte avec ombre légère (par défaut)
- `compact` - Carte avec moins de padding

#### Exemple

```tsx
import { Card } from '@/components/ui';

<Card variant="elevated">
  <Text>Contenu de la carte</Text>
</Card>

<Card variant="surface" onPress={handlePress}>
  <Text>Carte pressable</Text>
</Card>

<Card variant="compact" padding={8}>
  <Text>Carte compacte</Text>
</Card>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `children` | `ReactNode` | - | Contenu de la carte |
| `variant` | `'surface' \| 'elevated' \| 'compact'` | `'surface'` | Variant de la carte |
| `style` | `ViewStyle` | - | Style personnalisé |
| `padding` | `number` | - | Padding personnalisé |
| `onPress` | `() => void` | - | Rendre la carte pressable |
| `accessibilityLabel` | `string` | - | Label accessibilité |

---

### Input

Input avec label, erreur, icônes et états.

#### Exemple

```tsx
import { Input } from '@/components/ui';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <Input
      label="Email"
      placeholder="votre@email.com"
      value={email}
      onChangeText={setEmail}
      error={error}
      keyboardType="email-address"
      autoCapitalize="none"
    />
  );
}
```

#### Avec icônes

```tsx
<Input
  label="Recherche"
  placeholder="Rechercher..."
  leftIcon={<Icon name="search" />}
  rightIcon={<Icon name="filter" />}
/>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `label` | `string` | - | Label au-dessus de l'input |
| `helperText` | `string` | - | Texte d'aide sous l'input |
| `error` | `string` | - | Message d'erreur (remplace helperText) |
| `leftIcon` | `ReactNode` | - | Icône à gauche |
| `rightIcon` | `ReactNode` | - | Icône à droite |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille de l'input |
| `disabled` | `boolean` | `false` | État désactivé |
| `containerStyle` | `ViewStyle` | - | Style conteneur |
| `inputStyle` | `TextStyle` | - | Style input |
| `...TextInputProps` | - | - | Toutes les props de TextInput |

---

### Header

Header avec titre et action à droite.

#### Exemple

```tsx
import { Header } from '@/components/ui';

<Header
  title="Mon Profil"
  subtitle="Gérer vos paramètres"
  rightAction={<Icon name="settings" />}
  onRightActionPress={handleSettings}
/>
```

#### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `title` | `string` | - | Titre du header |
| `subtitle` | `string` | - | Sous-titre optionnel |
| `rightAction` | `ReactNode` | - | Action à droite |
| `onRightActionPress` | `() => void` | - | Callback pour l'action |
| `style` | `ViewStyle` | - | Style personnalisé |
| `titleStyle` | `TextStyle` | - | Style titre personnalisé |
| `accessibilityLabel` | `string` | - | Label accessibilité |

---

## Exemple complet

Voir `/components/ui/ExampleScreen.tsx` pour un exemple complet d'utilisation de tous les composants.

## Accessibilité

Tous les composants incluent :
- Support des lecteurs d'écran (`accessibilityLabel`, `accessibilityHint`)
- Zones de toucher agrandies (`hitSlop`)
- États accessibles (`accessibilityState`)
- Contrastes respectant les standards AA/AAA

## Styles personnalisés

Tous les composants acceptent des props `style` pour personnaliser l'apparence tout en respectant le design system de base.

