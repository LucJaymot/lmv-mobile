import React, { useState } from 'react';
import { View, ScrollView, Text, Alert } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Header } from './Header';
import { useTheme } from '@/theme/hooks';
import { createTextStyles, createCardStyles } from '@/theme/styles';

/**
 * Écran d'exemple montrant l'utilisation des composants UI du design system
 * 
 * Ce fichier sert de référence pour l'utilisation des composants.
 * Vous pouvez le supprimer ou le garder comme documentation.
 */
export const ExampleScreen: React.FC = () => {
  const { theme } = useTheme();
  const textStyles = createTextStyles(theme);
  const cardStyles = createCardStyles(theme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    // Simulation d'une requête
    setTimeout(() => {
      if (!email || !password) {
        setError('Veuillez remplir tous les champs');
      } else {
        Alert.alert('Succès', 'Connexion réussie !');
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header
        title="Design System"
        subtitle="Exemples de composants"
        rightAction={
          <Text style={[textStyles.accentSmall, { color: theme.colors.accent }]}>
            ⚙️
          </Text>
        }
        onRightActionPress={() => Alert.alert('Paramètres', 'Ouvrir les paramètres')}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          gap: theme.spacing[4],
        }}
      >
        {/* Section Boutons */}
        <Card variant="elevated">
          <Text style={[textStyles.h4, { marginBottom: theme.spacing[3] }]}>
            Boutons
          </Text>

          <View style={{ gap: theme.spacing[3] }}>
            <Button variant="primary" onPress={handleLogin} loading={loading}>
              Primary (Loading)
            </Button>

            <Button variant="secondary" onPress={() => Alert.alert('Secondary')}>
              Secondary
            </Button>

            <Button variant="ghost" onPress={() => Alert.alert('Ghost')}>
              Ghost
            </Button>

            <Button variant="text" onPress={() => Alert.alert('Text')}>
              Text
            </Button>

            <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
              <Button variant="primary" size="sm" onPress={() => {}}>
                Small
              </Button>
              <Button variant="primary" size="md" onPress={() => {}}>
                Medium
              </Button>
              <Button variant="primary" size="lg" onPress={() => {}}>
                Large
              </Button>
            </View>

            <Button variant="primary" disabled onPress={() => {}}>
              Disabled
            </Button>
          </View>
        </Card>

        {/* Section Inputs */}
        <Card variant="surface">
          <Text style={[textStyles.h4, { marginBottom: theme.spacing[3] }]}>
            Inputs
          </Text>

          <View style={{ gap: theme.spacing[2] }}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={error}
              helperText="Minimum 8 caractères"
            />

            <Input
              label="Recherche"
              placeholder="Rechercher..."
              leftIcon={<Text style={{ color: theme.colors.textMuted }}>🔍</Text>}
            />

            <Input
              label="Désactivé"
              placeholder="Champ désactivé"
              disabled
              value="Valeur non modifiable"
            />
          </View>
        </Card>

        {/* Section Cards */}
        <View style={{ gap: theme.spacing[3] }}>
          <Text style={[textStyles.h4]}>Cartes</Text>

          <Card variant="surface" onPress={() => Alert.alert('Carte Surface')}>
            <Text style={[textStyles.body, { marginBottom: theme.spacing[2] }]}>
              Carte Surface (pressable)
            </Text>
            <Text style={textStyles.bodySmall}>
              Variant par défaut avec fond surface
            </Text>
          </Card>

          <Card variant="elevated">
            <Text style={[textStyles.body, { marginBottom: theme.spacing[2] }]}>
              Carte Elevated
            </Text>
            <Text style={textStyles.bodySmall}>
              Avec ombre légère pour effet de profondeur
            </Text>
          </Card>

          <Card variant="compact">
            <Text style={textStyles.bodySmall}>
              Carte Compact avec moins de padding
            </Text>
          </Card>
        </View>

        {/* Section Typographie */}
        <Card variant="elevated">
          <Text style={[textStyles.h4, { marginBottom: theme.spacing[3] }]}>
            Typographie
          </Text>

          <View style={{ gap: theme.spacing[2] }}>
            <Text style={textStyles.h1}>Titre H1</Text>
            <Text style={textStyles.h2}>Titre H2</Text>
            <Text style={textStyles.h3}>Titre H3</Text>
            <Text style={textStyles.h4}>Titre H4</Text>
            <Text style={textStyles.body}>Corps de texte régulier</Text>
            <Text style={textStyles.bodyMedium}>Corps de texte medium</Text>
            <Text style={textStyles.bodySmall}>Petit texte</Text>
            <Text style={textStyles.accent}>Texte accent (lien)</Text>
            <Text style={textStyles.label}>Label</Text>
            <Text style={textStyles.error}>Message d'erreur</Text>
            <Text style={textStyles.success}>Message de succès</Text>
          </View>
        </Card>

        {/* Section Couleurs */}
        <Card variant="surface">
          <Text style={[textStyles.h4, { marginBottom: theme.spacing[3] }]}>
            Palette de couleurs
          </Text>

          <View style={{ gap: theme.spacing[2] }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[2],
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.radius.base,
                  backgroundColor: theme.colors.primary,
                }}
              />
              <Text style={textStyles.bodySmall}>Primary: {theme.colors.primary}</Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[2],
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.radius.base,
                  backgroundColor: theme.colors.accent,
                }}
              />
              <Text style={textStyles.bodySmall}>Accent: {theme.colors.accent}</Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[2],
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.radius.base,
                  backgroundColor: theme.colors.success,
                }}
              />
              <Text style={textStyles.bodySmall}>Success: {theme.colors.success}</Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[2],
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.radius.base,
                  backgroundColor: theme.colors.error,
                }}
              />
              <Text style={textStyles.bodySmall}>Error: {theme.colors.error}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

