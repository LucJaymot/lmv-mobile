
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { user, clientCompany, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="building.2.fill"
              android_material_icon_name="business"
              size={48}
              color={colors.primary}
            />
          </View>
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
        </View>

        <TouchableOpacity
          style={[buttonStyles.outline, styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={commonStyles.buttonTextOutline}>Déconnexion</Text>
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
    paddingBottom: 100,
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
