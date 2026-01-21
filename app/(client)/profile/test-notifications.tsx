import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { notificationService } from '@/services/notificationService';
import { commonStyles } from '@/styles/commonStyles';
import { useTheme } from '@/theme/hooks';
import { IconSymbol } from '@/components/IconSymbol';

export default function TestNotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [permissionStatus, setPermissionStatus] = useState<string>('Vérification...');
  const [notificationTitle, setNotificationTitle] = useState('Test Notification');
  const [notificationBody, setNotificationBody] = useState('Ceci est une notification de test');

  useEffect(() => {
    checkPermissions();
    requestPermissions();
    setupNotificationListeners();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(
        status === 'granted' ? '✅ Autorisé' : 
        status === 'denied' ? '❌ Refusé' : 
        '⚠️ Non défini'
      );
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      setPermissionStatus('❌ Erreur');
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        checkPermissions(); // Mettre à jour le statut
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Écouter les notifications reçues quand l'app est au premier plan
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification reçue:', notification);
      Alert.alert(
        'Notification reçue',
        `Titre: ${notification.request.content.title}\nMessage: ${notification.request.content.body}`,
        [{ text: 'OK' }]
      );
    });

    // Écouter les interactions avec les notifications
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification cliquée:', response);
      const data = response.notification.request.content.data;
      Alert.alert(
        'Notification cliquée',
        `Données: ${JSON.stringify(data, null, 2)}`,
        [{ text: 'OK' }]
      );
    });
  };

  const testLocalNotification = async () => {
    try {
      await notificationService.showLocalNotification(
        notificationTitle,
        notificationBody,
        { test: true, timestamp: Date.now() }
      );
      Alert.alert('✅ Succès', 'Notification locale envoyée !');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('❌ Erreur', 'Impossible d\'envoyer la notification');
    }
  };

  const testScheduledNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationBody,
          data: { test: true, scheduled: true },
          sound: true,
        },
        trigger: {
          seconds: 5, // Dans 5 secondes
        },
      });
      Alert.alert('✅ Succès', 'Notification programmée dans 5 secondes !');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('❌ Erreur', 'Impossible de programmer la notification');
    }
  };

  const testRepeatingNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Notification répétée',
          body: 'Cette notification se répète toutes les minutes',
          data: { test: true, repeating: true },
          sound: true,
        },
        trigger: {
          seconds: 60, // Toutes les 60 secondes
          repeats: true,
        },
      });
      Alert.alert('✅ Succès', 'Notification répétée programmée !');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('❌ Erreur', 'Impossible de programmer la notification répétée');
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('✅ Succès', 'Toutes les notifications programmées ont été annulées');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('❌ Erreur', 'Impossible d\'annuler les notifications');
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Test des Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Statut des permissions */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Statut</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.colors.text }]}>Permissions:</Text>
            <Text style={[styles.statusValue, { color: theme.colors.text }]}>{permissionStatus}</Text>
          </View>
          {permissionStatus !== '✅ Autorisé' && (
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: theme.colors.primary, marginTop: 12 }]}
              onPress={requestPermissions}
            >
              <Text style={styles.testButtonText}>Demander les permissions</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personnalisation */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personnaliser la notification</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
            placeholder="Titre de la notification"
            placeholderTextColor={theme.colors.textSecondary}
            value={notificationTitle}
            onChangeText={setNotificationTitle}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
            placeholder="Message de la notification"
            placeholderTextColor={theme.colors.textSecondary}
            value={notificationBody}
            onChangeText={setNotificationBody}
            multiline
          />
        </View>

        {/* Tests */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tests</Text>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
            onPress={testLocalNotification}
          >
            <Text style={styles.testButtonText}>📱 Notification locale (immédiate)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
            onPress={testScheduledNotification}
          >
            <Text style={styles.testButtonText}>⏰ Notification programmée (5 secondes)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
            onPress={testRepeatingNotification}
          >
            <Text style={styles.testButtonText}>🔄 Notification répétée (toutes les minutes)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#ff4444' }]}
            onPress={cancelAllNotifications}
          >
            <Text style={styles.testButtonText}>❌ Annuler toutes les notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Instructions</Text>
          <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
            • Les notifications locales s'affichent immédiatement{'\n'}
            • Les notifications programmées apparaîtront après le délai spécifié{'\n'}
            • Les notifications répétées se répètent selon l'intervalle configuré{'\n'}
            • Assurez-vous que les permissions sont accordées dans les paramètres de l'appareil
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  testButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
