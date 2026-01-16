
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
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useTheme } from '@/theme/hooks';
import { IconSymbol } from '@/components/IconSymbol';
import { pickImage, uploadAvatar } from '@/services/storageService';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { user, clientCompany, logout, updateProfile } = useAuth();
  const { theme, mode, setMode } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Basculer entre light et dark mode
  const isDarkMode = mode === 'dark' || mode === 'trueBlack';
  const handleThemeToggle = (value: boolean) => {
    setMode(value ? 'dark' : 'light');
  };

  const handleAvatarPress = async () => {
    try {
      const result = await pickImage();
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri || !user?.id || !clientCompany) {
        return;
      }

      setIsUploadingAvatar(true);
      
      // Upload l'image vers Supabase Storage
      const avatarUrl = await uploadAvatar(asset.uri, user.id);
      
      // Mettre à jour le profil avec la nouvelle URL
      await updateProfile({ avatarUrl });
      
      Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour la photo de profil');
    } finally {
      setIsUploadingAvatar(false);
    }
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
                // Le layout client redirigera automatiquement, mais on force aussi
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.avatarContainer, { backgroundColor: theme.colors.surface }]}
            onPress={handleAvatarPress}
            disabled={isUploadingAvatar}
            activeOpacity={0.7}
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="large" color={theme.colors.accent} />
            ) : clientCompany?.avatarUrl ? (
              <Image
                source={{ uri: clientCompany.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <IconSymbol
                ios_icon_name="building.2.fill"
                android_material_icon_name="business"
                size={48}
                color={theme.colors.accent}
              />
            )}
            {!isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera-alt"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.companyName, { color: theme.colors.text }]}>{clientCompany?.name}</Text>
          <Text style={[styles.email, { color: theme.colors.textMuted }]}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Informations entreprise</Text>
          <View style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Contact</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{clientCompany?.contact}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Téléphone</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{clientCompany?.phone}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{clientCompany?.email}</Text>
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
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Adresse</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{clientCompany?.address}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Actions</Text>
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: theme.colors.surface }]} 
            onPress={() => router.push('/(client)/profile/edit')}
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
            onPress={() => router.push('/(client)/profile/notifications')}
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
            onPress={() => router.push('/(client)/(tabs)/invoices')}
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
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#F4F3F4'}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            buttonStyles.outline,
            styles.logoutButton,
            { borderColor: theme.colors.error },
            isLoggingOut && styles.buttonDisabled,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={theme.colors.error} />
          ) : (
            <Text style={[commonStyles.buttonTextOutline, { color: theme.colors.error }]}>Déconnexion</Text>
          )}
        </TouchableOpacity>
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
    paddingBottom: Platform.OS === 'web' ? 100 : 120,
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
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
