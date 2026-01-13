# Migration vers Design System White-First

## ✅ État actuel de la migration

### Phase 1 : Mise en place du thème (TERMINÉE)

1. **Thème transformé en "white-first"** (`theme/theme.ts`)
   - Fonds : `#FFFFFF` (blanc pur) et `#FAFAFA` (blanc cassé)
   - Textes : `#040F16` (noir doux) sur fond blanc
   - Bordures : `#E5E7EB` (gris très clair, lignes fines)
   - Ombres : très subtiles (opacité 0.05-0.12)
   - Couleurs de marque (`#000022`, `#002B39`, `#040F16`) : **uniquement pour accents** (CTA, liens, focus, indicateurs)

2. **ThemeProvider intégré** (`app/_layout.tsx`)
   - ThemeProvider personnalisé enveloppe toute l'app
   - Synchronisation avec React Navigation Theme
   - Mode par défaut : `light` (white-first)

3. **Composants UI adaptés**
   - `Button` : texte blanc sur fond coloré pour primary/secondary
   - `Card` : fonds blancs avec bordures très claires
   - `Input` : fond blanc, bordures claires, focus avec couleur de marque
   - `Header` : utilise le thème dynamique

### Phase 2 : Migration des écrans (EN COURS)

#### ✅ Écrans migrés
- ✅ `app/index.tsx` - Écran de redirection
- ✅ `app/auth/login.tsx` - Écran de connexion (utilise Button, Input du design system)
- ✅ `app/(tabs)/(home)/index.tsx` - Écran d'accueil

#### ⏳ Écrans à migrer (priorité)
1. `app/auth/register.tsx` - Inscription
2. `app/auth/forgot-password.tsx` - Mot de passe oublié
3. `app/(client)/(tabs)/dashboard.tsx` - Dashboard client
4. `app/(provider)/(tabs)/dashboard.tsx` - Dashboard provider
5. Autres écrans selon usage

## 📋 Stratégie de migration progressive

### Étape 1 : Identifier les écrans à migrer
```bash
# Rechercher les imports de styles anciens
grep -r "from '@/styles/commonStyles'" app/
grep -r "colors\." app/ | grep -v "theme.colors"
```

### Étape 2 : Migrer écran par écran

Pour chaque écran :

1. **Remplacer les imports**
   ```tsx
   // AVANT
   import { colors, commonStyles } from '@/styles/commonStyles';
   
   // APRÈS
   import { useTheme } from '@/theme/hooks';
   import { createTextStyles, createStyles } from '@/theme/styles';
   ```

2. **Utiliser le hook useTheme**
   ```tsx
   const { theme } = useTheme();
   const textStyles = createTextStyles(theme);
   const createStylesWithTheme = createStyles(theme);
   ```

3. **Remplacer les couleurs hardcodées**
   ```tsx
   // AVANT
   backgroundColor: colors.background
   
   // APRÈS
   backgroundColor: theme.colors.background
   ```

4. **Utiliser les composants UI du design system**
   ```tsx
   // AVANT
   <TouchableOpacity style={buttonStyles.primary}>
     <Text style={commonStyles.buttonText}>Valider</Text>
   </TouchableOpacity>
   
   // APRÈS
   <Button variant="primary" onPress={handlePress}>
     Valider
   </Button>
   ```

5. **Remplacer les styles inline par createStyles**
   ```tsx
   const styles = createStylesWithTheme({
     container: {
       backgroundColor: theme.colors.background,
       padding: theme.spacing[4],
     },
   });
   ```

### Étape 3 : Nettoyage

Une fois tous les écrans migrés :
1. Supprimer les imports inutilisés de `commonStyles`
2. Vérifier qu'aucun hardcode de couleur ne reste
3. Tests visuels sur tous les écrans

## 🎨 Principes du design white-first

### Couleurs autorisées pour fonds
- ✅ `#FFFFFF` (blanc pur)
- ✅ `#FAFAFA` (blanc cassé)
- ✅ `#F9FAFB` (gris très clair)
- ❌ **JAMAIS** les couleurs de marque (`#000022`, `#002B39`, `#040F16`) pour fonds

### Couleurs de marque (accents uniquement)
- CTA (boutons primary)
- Liens
- Icônes importantes
- États focus
- Indicateurs (badges, tags)
- Bordures au focus

### Espacement
- Utiliser `theme.spacing` (4, 8, 12, 16, 24, 32, etc.)
- Beaucoup d'air entre les éléments

### Ombres
- Très subtiles (`shadows.sm` ou `shadows.base`)
- Opacité max 0.12

### Bordures
- Lignes fines (1px)
- Couleur : `theme.colors.border` (`#E5E7EB`)

## 🔧 Composants disponibles

### Button
```tsx
<Button variant="primary" size="md" onPress={handlePress}>
  Texte
</Button>
// Variants: primary, secondary, ghost, text
// Sizes: sm, md, lg
```

### Input
```tsx
<Input
  label="Email"
  placeholder="votre@email.com"
  error={error}
  leftIcon={<IconSymbol ... />}
  rightIcon={<IconSymbol ... />}
/>
```

### Card
```tsx
<Card variant="elevated" onPress={handlePress}>
  Contenu
</Card>
// Variants: surface, elevated, compact
```

### Header
```tsx
<Header
  title="Mon Titre"
  subtitle="Sous-titre"
  rightAction={<IconSymbol ... />}
  onRightActionPress={handleAction}
/>
```

## 📝 Notes importantes

- **Compatibilité** : Les anciens styles (`commonStyles`) restent disponibles pendant la migration
- **Pas de breaking changes** : Les composants UI gardent les mêmes props API
- **Migration incrémentale** : Chaque écran peut être migré indépendamment
- **Tests** : Tester visuellement chaque écran après migration

## 🚀 Prochaines étapes

1. Migrer les écrans d'authentification restants (register, forgot-password)
2. Migrer les dashboards (client, provider, admin)
3. Migrer les écrans de profil
4. Migrer les écrans de listes (invoices, requests, vehicles)
5. Nettoyage final et suppression des styles obsolètes

