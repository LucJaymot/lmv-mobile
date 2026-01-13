# Guide de Migration - Design System

Ce guide vous aide à migrer progressivement votre application vers le nouveau design system premium dark.

## ✅ Intégration Complète

Le design system est maintenant intégré à l'ensemble de l'application :

1. **ThemeProvider** : Intégré dans `app/_layout.tsx` au niveau racine
2. **React Navigation** : Synchronisé avec notre design system via `NavigationThemeWrapper`
3. **Styles communs** : Mis à jour pour utiliser les couleurs du thème par défaut

## 🚀 Utilisation Immédiate

### Pour les Nouveaux Composants

Utilisez directement les composants UI et le thème :

```tsx
import { Button, Card, Input, Header } from '@/components/ui';
import { useTheme } from '@/theme/hooks';
import { getThemeStyles } from '@/styles/themeStyles';

function MyScreen() {
  const { theme } = useTheme();
  const styles = getThemeStyles(theme);

  return (
    <View style={styles.container}>
      <Header title="Mon Écran" />
      <Card variant="elevated">
        <Input label="Email" placeholder="votre@email.com" />
        <Button variant="primary" onPress={handlePress}>
          Valider
        </Button>
      </Card>
    </View>
  );
}
```

### Pour Migrer un Composant Existant

#### Avant (ancien code)

```tsx
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

function MyComponent() {
  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Titre</Text>
      <TouchableOpacity style={buttonStyles.primary}>
        <Text style={commonStyles.buttonText}>Bouton</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### Après (avec le nouveau design system)

```tsx
import { useTheme } from '@/theme/hooks';
import { getThemeStyles } from '@/styles/themeStyles';
import { Button } from '@/components/ui';

function MyComponent() {
  const { theme } = useTheme();
  const styles = getThemeStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text.h2}>Titre</Text>
      <Button variant="primary" onPress={handlePress}>
        Bouton
      </Button>
    </View>
  );
}
```

## 📋 Checklist de Migration

### Étape 1 : Imports
- [ ] Remplacer `import { colors, commonStyles } from '@/styles/commonStyles'`
- [ ] Par `import { useTheme } from '@/theme/hooks'` et `import { getThemeStyles } from '@/styles/themeStyles'`

### Étape 2 : Utilisation du Thème
- [ ] Ajouter `const { theme } = useTheme()` dans le composant
- [ ] Créer les styles avec `const styles = getThemeStyles(theme)`

### Étape 3 : Remplacer les Composants
- [ ] Remplacer les `TouchableOpacity` par `<Button>` du design system
- [ ] Remplacer les `View` avec styles de carte par `<Card>`
- [ ] Remplacer les `TextInput` par `<Input>`

### Étape 4 : Styles Typographiques
- [ ] Remplacer `commonStyles.title` par `styles.text.h1` ou `styles.text.h2`
- [ ] Remplacer `commonStyles.text` par `styles.text.body`
- [ ] Remplacer `commonStyles.textSecondary` par `styles.text.bodySmall`

## 🎨 Mapping des Styles

| Ancien Style | Nouveau Style |
|-------------|---------------|
| `commonStyles.title` | `styles.text.h1` ou `styles.text.h2` |
| `commonStyles.subtitle` | `styles.text.h3` ou `styles.text.h4` |
| `commonStyles.text` | `styles.text.body` |
| `commonStyles.textSecondary` | `styles.text.bodySmall` |
| `commonStyles.card` | `<Card variant="surface">` ou `styles.card.surface` |
| `buttonStyles.primary` | `<Button variant="primary">` |
| `buttonStyles.outline` | `<Button variant="ghost">` |
| `buttonStyles.text` | `<Button variant="text">` |
| `commonStyles.input` | `<Input>` |

## 🔄 Compatibilité

Les anciens styles dans `commonStyles.ts` sont toujours disponibles mais utilisent maintenant les couleurs du thème par défaut. Ils continueront de fonctionner, mais il est recommandé de migrer progressivement vers le nouveau système.

## 💡 Bonnes Pratiques

1. **Utilisez les composants UI** : Ils sont optimisés pour l'accessibilité et le design system
2. **Utilisez le hook useTheme** : Pour accéder aux couleurs, spacing, etc. dynamiquement
3. **Respectez la hiérarchie typographique** : Utilisez h1, h2, h3, h4 pour les titres
4. **Utilisez les variants** : primary, secondary, ghost, text pour les boutons
5. **Accessibilité** : Les composants incluent déjà les props d'accessibilité

## 📚 Ressources

- Documentation du thème : `/theme/README.md`
- Documentation des composants : `/components/ui/README.md`
- Exemple d'utilisation : `/components/ui/ExampleScreen.tsx`

## 🐛 Problèmes Courants

### Le thème ne se met pas à jour
Assurez-vous que votre composant est bien à l'intérieur du `ThemeProvider` dans `app/_layout.tsx`.

### Les couleurs ne correspondent pas
Vérifiez que vous utilisez `useTheme()` et non les couleurs statiques de `commonStyles.ts`.

### Erreur "useTheme must be used within ThemeProvider"
Votre composant doit être rendu à l'intérieur du `ThemeProvider` dans le layout racine.

