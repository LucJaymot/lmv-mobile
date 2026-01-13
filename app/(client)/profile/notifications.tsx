import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newRequests: boolean;
  confirmations: boolean;
  reminders: boolean;
  statusUpdates: boolean;
}

const NOTIFICATION_STORAGE_KEY = '@lmv_notification_settings';

export default function NotificationsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    newRequests: true,
    confirmations: true,
    reminders: true,
    statusUpdates: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de notifications:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    
    // Si on désactive les notifications push, désactiver aussi les sous-options
    if (key === 'pushEnabled' && !value) {
      newSettings.confirmations = false;
      newSettings.reminders = false;
      newSettings.statusUpdates = false;
    }
    
    // Si on désactive les notifications email, ne pas affecter les autres paramètres
    saveSettings(newSettings);
  };


  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications Push</Text>
            <View style={commonStyles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <IconSymbol
                    ios_icon_name="bell.fill"
                    android_material_icon_name="notifications"
                    size={24}
                    color={colors.primary}
                  />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Activer les notifications push</Text>
                    <Text style={styles.settingDescription}>
                      Recevoir des notifications sur votre appareil
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.pushEnabled}
                  onValueChange={(value) => updateSetting('pushEnabled', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={settings.pushEnabled ? colors.primary : '#F4F3F4'}
                  ios_backgroundColor={colors.border}
                />
              </View>

              {settings.pushEnabled && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.settingRow}>
                    <View style={styles.settingContent}>
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check-circle"
                        size={20}
                        color={colors.textSecondary}
                      />
                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Confirmations</Text>
                        <Text style={styles.settingDescription}>
                          Notifier lors de la confirmation d'une demande
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.confirmations}
                      onValueChange={(value) => updateSetting('confirmations', value)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={settings.confirmations ? colors.primary : '#F4F3F4'}
                      ios_backgroundColor={colors.border}
                    />
                  </View>

                  <View style={styles.divider} />
                  <View style={styles.settingRow}>
                    <View style={styles.settingContent}>
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="schedule"
                        size={20}
                        color={colors.textSecondary}
                      />
                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Rappels</Text>
                        <Text style={styles.settingDescription}>
                          Recevoir des rappels avant un lavage programmé
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.reminders}
                      onValueChange={(value) => updateSetting('reminders', value)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={settings.reminders ? colors.primary : '#F4F3F4'}
                      ios_backgroundColor={colors.border}
                    />
                  </View>

                  <View style={styles.divider} />
                  <View style={styles.settingRow}>
                    <View style={styles.settingContent}>
                      <IconSymbol
                        ios_icon_name="arrow.triangle.2.circlepath"
                        android_material_icon_name="sync"
                        size={20}
                        color={colors.textSecondary}
                      />
                      <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Mises à jour de statut</Text>
                        <Text style={styles.settingDescription}>
                          Notifier lors des changements de statut des demandes
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.statusUpdates}
                      onValueChange={(value) => updateSetting('statusUpdates', value)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={settings.statusUpdates ? colors.primary : '#F4F3F4'}
                      ios_backgroundColor={colors.border}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications Email</Text>
          <View style={commonStyles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Activer les notifications email</Text>
                  <Text style={styles.settingDescription}>
                    Recevoir des notifications par email
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.emailEnabled}
                onValueChange={(value) => updateSetting('emailEnabled', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.emailEnabled ? colors.primary : '#F4F3F4'}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </View>
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
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
});

