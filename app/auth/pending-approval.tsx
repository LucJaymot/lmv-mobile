import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/theme/hooks';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border }]}>
            <IconSymbol
              ios_icon_name="hourglass"
              android_material_icon_name="hourglass-empty"
              size={36}
              color={theme.colors.accent}
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>Compte en attente</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Votre compte est en attente d&apos;approbation par l&apos;équipe LMV.
          </Text>

          {email ? (
            <Text style={[styles.email, { color: theme.colors.text }]}>
              {email}
            </Text>
          ) : null}

          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            Vous recevrez un email lorsque votre compte sera validé.
          </Text>

          <Button
            variant="primary"
            size="lg"
            onPress={() => router.replace('/auth/login')}
            style={styles.button}
          >
            Retour à la connexion
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 24 : 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  email: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    marginTop: 18,
  },
});

