
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/theme/hooks';
import { createTextStyles } from '@/theme/styles';
import { Button } from '@/components/ui/Button';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { user, provider, logout } = useAuth();
  const { theme, mode, setMode } = useTheme();
  const textStyles = createTextStyles(theme);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Basculer entre light et dark mode
  const isDarkMode = mode === 'dark' || mode === 'trueBlack';
  const handleThemeToggle = (value: boolean) => {
    setMode(value ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Empêcher les clics multiples
    
    console.log('handleLogout called');
    
    // Sur web, utiliser window.confirm
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (!confirmed) {
        return;
      }
      
      setIsLoggingOut(true);
      try {
        console.log('Logging out...');
        await logout();
        console.log('Logout successful, redirecting...');
        router.replace('/auth/login');
      } catch (error: any) {
        console.error('Erreur lors de la déconnexion:', error);
        alert(error.message || 'Impossible de se déconnecter');
        setIsLoggingOut(false);
      }
    } else {
      // Sur mobile, utiliser Alert.alert
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { 
            text: 'Annuler', 
            style: 'cancel',
            onPress: () => console.log('Logout cancelled')
          },
          {
            text: 'Déconnexion',
            style: 'destructive',
            onPress: async () => {
              setIsLoggingOut(true);
              try {
                console.log('Logging out...');
                await logout();
                console.log('Logout successful, redirecting...');
                router.replace('/auth/login');
              } catch (error: any) {
                console.error('Erreur lors de la déconnexion:', error);
                Alert.alert('Erreur', error.message || 'Impossible de se déconnecter');
                setIsLoggingOut(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const getServiceLabel = (service: string) => {
    switch (service) {
      case 'exterior':
        return 'Extérieur';
      case 'interior':
        return 'Intérieur';
      case 'complete':
        return 'Complet';
      default:
        return service;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.surface }]}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="local-car-wash"
              size={48}
              color={theme.colors.accent}
            />
          </View>
          <Text style={[styles.providerName, { color: theme.colors.text }]}>{provider?.name}</Text>
          <Text style={[styles.email, { color: theme.colors.textMuted }]}>{user?.email}</Text>
          {/* TEMPORAIREMENT CACHÉ - À réactiver plus tard */}
          {false && (
            <View style={styles.ratingContainer}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={20}
                color={theme.colors.warning}
              />
              <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                {provider?.averageRating?.toFixed(1) || '0.0'} ({provider?.totalRatings || 0} avis)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Informations</Text>
          <View style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Téléphone</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{provider?.phone}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Zone d&apos;intervention</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {provider?.baseCity} ({provider?.radiusKm} km)
                </Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="text.alignleft"
                android_material_icon_name="description"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Description</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{provider?.description || 'Aucune description'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Services proposés</Text>
          <View style={styles.servicesContainer}>
            {provider?.services.map((service, index) => (
              <View key={index} style={[styles.serviceChip, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.serviceChipText}>{getServiceLabel(service)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Actions</Text>
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(provider)/profile/edit')}
          >
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={20}
              color={theme.colors.accent}
            />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Modifier le profil</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(provider)/profile/notifications')}
          >
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={20}
              color={theme.colors.accent}
            />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Notifications</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(provider)/(tabs)/invoices')}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={20}
              color={theme.colors.accent}
            />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Factures</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          <View style={[styles.actionItem, { backgroundColor: theme.colors.surface }]}>
            <IconSymbol
              ios_icon_name={isDarkMode ? "moon.fill" : "sun.max.fill"}
              android_material_icon_name={isDarkMode ? "dark-mode" : "light-mode"}
              size={20}
              color={theme.colors.accent}
            />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              {isDarkMode ? 'Dark mode' : 'Light mode'}
            </Text>
            <View style={styles.switchContainer}>
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ 
                  false: Platform.OS === 'ios' ? theme.colors.border : '#D1D5DB', 
                  true: theme.colors.accent 
                }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : '#FFFFFF'}
                ios_backgroundColor={Platform.OS === 'ios' ? theme.colors.border : undefined}
                style={styles.switch}
              />
            </View>
          </View>
        </View>

        <Button
          variant="ghost"
          onPress={handleLogout}
          disabled={isLoggingOut}
          loading={isLoggingOut}
          style={{ marginTop: 16, borderColor: theme.colors.error }}
          textStyle={{ color: theme.colors.error }}
        >
          Déconnexion
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'web' ? 100 : 140,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  providerName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 16,
  },
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: Platform.OS === 'android' ? 50 : undefined,
    overflow: 'hidden',
  },
  switch: {
    ...(Platform.OS === 'android' && {
      transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
      marginRight: -8,
    }),
  },
});
