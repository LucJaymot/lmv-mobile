import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const NOTIFICATION_TOKEN_KEY = '@lmv_notification_token';

// Configurez comment les notifications doivent être gérées lorsqu'elles arrivent
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newRequests: boolean;
  confirmations: boolean;
  reminders: boolean;
  statusUpdates: boolean;
}

/**
 * Service de gestion des notifications push
 */
export const notificationService = {
  /**
   * Demande les permissions de notification et enregistre le token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Vérifier si on est sur web (pas de notifications push natives)
      if (Platform.OS === 'web') {
        console.log('⚠️ Les notifications push ne sont pas disponibles sur web');
        return null;
      }

      // Demander les permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permission de notification refusée');
        return null;
      }

      // Obtenir le token Expo Push
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-project-id', // À configurer dans app.config.js
      });

      const token = tokenData.data;
      console.log('✅ Token de notification obtenu:', token);

      // Sauvegarder le token localement
      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);

      // Enregistrer le token dans la base de données
      await this.saveTokenToDatabase(token);

      return token;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement des notifications:', error);
      return null;
    }
  },

  /**
   * Enregistre le token de notification dans la base de données
   */
  async saveTokenToDatabase(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ Aucun utilisateur connecté, impossible de sauvegarder le token');
        return;
      }

      // Enregistrer le token dans la table users (ou créer une table dédiée)
      const { error } = await supabase
        .from('users')
        .update({ 
          notification_token: token,
          notification_token_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Erreur lors de la sauvegarde du token:', error);
        // Si la colonne n'existe pas encore, on peut créer une table séparée
        // Pour l'instant, on log juste l'erreur
      } else {
        console.log('✅ Token enregistré dans la base de données');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
    }
  },

  /**
   * Récupère le token de notification enregistré localement
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
      return null;
    }
  },

  /**
   * Vérifie si les notifications sont activées dans les paramètres
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settingsJson = await AsyncStorage.getItem('@lmv_notification_settings');
      if (!settingsJson) return true; // Par défaut activées

      const settings: NotificationSettings = JSON.parse(settingsJson);
      return settings.pushEnabled === true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des paramètres:', error);
      return true; // Par défaut activées
    }
  },

  /**
   * Vérifie si une option spécifique de notification est activée
   */
  async isNotificationTypeEnabled(type: 'newRequests' | 'confirmations' | 'reminders' | 'statusUpdates'): Promise<boolean> {
    try {
      const settingsJson = await AsyncStorage.getItem('@lmv_notification_settings');
      if (!settingsJson) return true; // Par défaut activées

      const settings: NotificationSettings = JSON.parse(settingsJson);
      
      // Vérifier que les notifications push sont activées
      if (!settings.pushEnabled) return false;
      
      // Vérifier que le type spécifique est activé
      return settings[type] === true;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des paramètres:', error);
      return true; // Par défaut activées
    }
  },

  /**
   * Affiche une notification locale (pour les tests)
   */
  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Afficher immédiatement
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage de la notification:', error);
    }
  },
};

/**
 * Fonction helper pour envoyer une notification aux prestataires
 * lorsqu'une nouvelle demande est créée
 */
export async function notifyProvidersOfNewRequest(requestId: string, address: string): Promise<void> {
  try {
    console.log('📢 Début de l\'envoi de notifications pour nouvelle demande:', { requestId, address });

    // Récupérer tous les prestataires
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('user_id, name');

    if (providersError) {
      console.error('❌ Erreur lors de la récupération des prestataires:', providersError);
      return;
    }

    if (!providers || providers.length === 0) {
      console.log('⚠️ Aucun prestataire trouvé');
      return;
    }

    console.log(`📋 ${providers.length} prestataire(s) trouvé(s)`);

    // Récupérer les tokens de notification des prestataires
    const userIds = providers.map(p => p.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, notification_token')
      .in('id', userIds)
      .not('notification_token', 'is', null);

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des tokens:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ Aucun token de notification trouvé pour les prestataires');
      return;
    }

    console.log(`📱 ${users.length} token(s) de notification trouvé(s)`);

    // Préparer le message de notification
    const notificationTitle = 'Nouvelle demande de lavage';
    const notificationBody = `Nouvelle demande disponible à ${address}`;
    const notificationData = {
      type: 'new_request',
      requestId,
      address,
    };

    // Pour l'instant, on utilise des notifications locales
    // Plus tard, on pourra utiliser l'API Expo Push Notifications pour envoyer aux autres appareils
    // Pour l'instant, on log juste pour le développement
    console.log('📢 Notification à envoyer:', {
      title: notificationTitle,
      body: notificationBody,
      data: notificationData,
      tokens: users.map(u => u.id),
    });

    // TODO: Implémenter l'envoi via Expo Push Notification API pour les autres appareils
    // Pour l'instant, les notifications locales seront gérées par le système d'événements Supabase
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des notifications:', error);
  }
}

