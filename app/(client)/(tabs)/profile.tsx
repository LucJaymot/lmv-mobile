
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
  const { theme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            disabled={isUploadingAvatar}
            activeOpacity={0.7}
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="large" color={colors.primary} />
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
                color={colors.primary}
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
          <Text style={styles.companyName}>{clientCompany?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations entreprise</Text>
          <View style={commonStyles.card}>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={colors.textSecondary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{clientCompany?.contact}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={20}
                color={colors.textSecondary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{clientCompany?.phone}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={20}
                color={colors.textSecondary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{clientCompany?.email}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={colors.textSecondary}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>{clientCompany?.address}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => router.push('/(client)/profile/edit')}
          >
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={20}
              color={colors.text}
            />
            <Text style={styles.actionText}>Modifier le profil</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/(client)/profile/notifications')}
          >
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={20}
              color={colors.text}
            />
            <Text style={styles.actionText}>Notifications</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/(client)/(tabs)/invoices')}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={20}
              color={colors.text}
            />
            <Text style={styles.actionText}>Factures</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
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
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
