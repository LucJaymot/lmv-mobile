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
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/theme/hooks';

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
  const { theme } = useTheme();
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
    
    // Injecter des styles CSS pour web afin de colorer les switches avec la couleur du thème
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'switch-blue-styles-provider';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      // Mettre à jour le style avec la couleur du thème
      styleElement.textContent = `
        /* Style pour les switches React Native sur web - utiliser accent-color */
        input[type="checkbox"] {
          accent-color: ${theme.colors.accent} !important;
        }
        /* Pour les switches React Native Web custom */
        input[type="checkbox"].react-native-switch-input {
          accent-color: ${theme.colors.accent} !important;
        }
      `;
    }
  }, [theme.colors.accent]);

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
      newSettings.newRequests = false;
      newSettings.reminders = false;
      newSettings.statusUpdates = false;
    }
    
    // Si on désactive les notifications email, ne pas affecter les autres paramètres
    saveSettings(newSettings);
  };


  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notifications Push</Text>
          <View style={commonStyles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <IconSymbol
                  ios_icon_name="bell.fill"
                  android_material_icon_name="notifications"
                  size={24}
                  color={theme.colors.accent}
                />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Activer les notifications push</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>
                    Recevoir des notifications sur votre appareil
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.pushEnabled}
                onValueChange={(value) => updateSetting('pushEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                thumbColor={settings.pushEnabled ? theme.colors.accent : '#F4F3F4'}
                ios_backgroundColor={theme.colors.border}
              />
            </View>

            {settings.pushEnabled && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.settingRow}>
                  <View style={styles.settingContent}>
                    <IconSymbol
                      ios_icon_name="doc.text.fill"
                      android_material_icon_name="description"
                      size={20}
                      color={theme.colors.textMuted}
                    />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Nouvelles demandes</Text>
                      <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>
                        Notifier lors de la création d'une nouvelle demande
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.newRequests}
                    onValueChange={(value) => updateSetting('newRequests', value)}
                    trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                    thumbColor={settings.newRequests ? theme.colors.accent : '#F4F3F4'}
                    ios_backgroundColor={theme.colors.border}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.settingRow}>
                  <View style={styles.settingContent}>
                    <IconSymbol
                      ios_icon_name="clock.fill"
                      android_material_icon_name="schedule"
                      size={20}
                      color={theme.colors.textMuted}
                    />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Rappels</Text>
                      <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>
                        Recevoir des rappels avant un lavage programmé
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.reminders}
                    onValueChange={(value) => updateSetting('reminders', value)}
                    trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                    thumbColor={settings.reminders ? theme.colors.accent : '#F4F3F4'}
                    ios_backgroundColor={theme.colors.border}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.settingRow}>
                  <View style={styles.settingContent}>
                    <IconSymbol
                      ios_icon_name="arrow.triangle.2.circlepath"
                      android_material_icon_name="sync"
                      size={20}
                      color={theme.colors.textMuted}
                    />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Mises à jour de statut</Text>
                      <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>
                        Notifier lors des changements de statut des demandes
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.statusUpdates}
                    onValueChange={(value) => updateSetting('statusUpdates', value)}
                    trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                    thumbColor={settings.statusUpdates ? theme.colors.accent : '#F4F3F4'}
                    ios_backgroundColor={theme.colors.border}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notifications Email</Text>
          <View style={commonStyles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={24}
                  color={theme.colors.accent}
                />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Activer les notifications email</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textMuted }]}>
                    Recevoir des notifications par email
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.emailEnabled}
                onValueChange={(value) => updateSetting('emailEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                thumbColor={settings.emailEnabled ? theme.colors.accent : '#F4F3F4'}
                ios_backgroundColor={theme.colors.border}
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});
