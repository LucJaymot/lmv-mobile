import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Configurez comment les notifications doivent être gérées lorsqu'elles arrivent
Notifications.setNotificationHandler({
  handleNotification: async () => ({
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
 * Service de gestion des notifications locales uniquement
 */
export const notificationService = {
  /**
   * Demande les permissions de notification (pour les notifications locales)
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Vérifier si on est sur web (pas de notifications natives)
      if (Platform.OS === 'web') {
        console.log('⚠️ Les notifications ne sont pas disponibles sur web');
        return false;
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
        return false;
      }

      console.log('✅ Permissions de notification accordées');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permissions:', error);
      return false;
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
   * Affiche une notification locale immédiate
   */
  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      // Pour une notification immédiate, utiliser scheduleNotificationAsync avec 1 seconde
      // (le minimum pour scheduleNotificationAsync est 1 seconde)
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: {
          type: 'timeInterval',
          seconds: 1, // 1 seconde = notification quasi-immédiate
        } as any, // Type assertion nécessaire pour compatibilité
      });
      console.log('✅ Notification locale programmée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage de la notification:', error);
      throw error;
    }
  },
};

/**
 * Fonction helper pour envoyer une notification aux prestataires
 * lorsqu'une nouvelle demande est créée
 * Note: Cette fonction est appelée côté serveur/client lors de la création.
 * Les notifications locales sont gérées via Supabase Realtime dans le layout du provider.
 */
export async function notifyProvidersOfNewRequest(requestId: string, address: string): Promise<void> {
  try {
    console.log('📢 Nouvelle demande créée:', { requestId, address });
    // Les notifications locales seront gérées via Supabase Realtime
    // Voir app/(provider)/_layout.tsx pour l'écoute en temps réel
  } catch (error) {
    console.error('❌ Erreur lors de la notification:', error);
  }
}

/**
 * Initialise l'écoute Supabase Realtime pour les nouvelles demandes
 * À utiliser dans le layout du provider
 * 
 * Inclut aussi un système de fallback qui vérifie périodiquement les nouvelles demandes
 * si Realtime ne fonctionne pas
 */
export function setupRealtimeNotificationsForProviders(
  onNewRequest: (requestId: string, address: string) => void
): () => void {
  console.log('🔔 Configuration de l\'écoute Realtime pour les nouvelles demandes...');
  console.log('📋 Table: wash_requests, Event: INSERT');

  // Créer un canal unique pour éviter les conflits
  const channelName = `new-wash-requests-${Date.now()}`;
  console.log('📡 Nom du canal:', channelName);

  // Système de fallback : garder une trace des dernières demandes vues
  // Partagé entre Realtime et fallback pour éviter les doublons
  let lastCheckedRequestId: string | null = null;
  const notifiedRequestIds = new Set<string>(); // Garder une trace des demandes déjà notifiées
  
  // Fonction de fallback pour vérifier les nouvelles demandes
  const checkForNewRequests = async () => {
    try {
      console.log('🔍 Vérification des nouvelles demandes (fallback)...');
      const { data: requests, error } = await supabase
        .from('wash_requests')
        .select('id, address, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Erreur lors de la vérification des demandes:', error);
        return;
      }

      if (requests && requests.length > 0) {
        // Trouver la demande la plus récente
        const latestRequest = requests[0];
        
        // Si c'est une nouvelle demande (pas la dernière qu'on a vue) ET qu'on ne l'a pas déjà notifiée
        if (latestRequest.id !== lastCheckedRequestId && !notifiedRequestIds.has(latestRequest.id)) {
          // Vérifier si elle a été créée récemment (dans les 30 dernières secondes)
          const createdAt = new Date(latestRequest.created_at).getTime();
          const now = Date.now();
          const timeDiff = now - createdAt;
          
          if (timeDiff < 30000) { // Moins de 30 secondes
            console.log('🆕 Nouvelle demande détectée via fallback:', latestRequest.id);
            lastCheckedRequestId = latestRequest.id;
            notifiedRequestIds.add(latestRequest.id);
            onNewRequest(latestRequest.id, latestRequest.address || 'Adresse non spécifiée');
          } else {
            // C'est une ancienne demande, on la marque comme vue
            lastCheckedRequestId = latestRequest.id;
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur dans le système de fallback:', error);
    }
  };

  // Initialiser lastCheckedRequestId avec la dernière demande
  (async () => {
    try {
      const { data: latest } = await supabase
        .from('wash_requests')
        .select('id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (latest) {
        lastCheckedRequestId = latest.id;
        console.log('📌 Dernière demande connue:', lastCheckedRequestId);
      }
    } catch (error) {
      console.log('ℹ️ Aucune demande existante trouvée');
    }
  })();

  // Vérifier périodiquement (toutes les 10 secondes) si Realtime ne fonctionne pas
  const fallbackInterval = setInterval(checkForNewRequests, 10000);

  // S'abonner aux insertions dans wash_requests
  // Note: Pas de filtre ici pour éviter les problèmes RLS - on filtrera dans le callback
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'wash_requests',
        // Retirer le filtre pour éviter les problèmes RLS - on filtrera dans le callback
      },
      (payload) => {
        console.log('📬 ===== NOUVELLE DEMANDE DÉTECTÉE =====');
        console.log('📬 Payload:', payload);
        console.log('📬 Event:', payload.eventType);
        console.log('📬 New:', payload.new);
        
        const newRequest = payload.new as any;
        
        // Filtrer pour ne garder que les demandes pending
        if (newRequest && newRequest.status === 'pending') {
          // Vérifier qu'on ne l'a pas déjà notifiée (éviter les doublons avec le fallback)
          if (notifiedRequestIds.has(newRequest.id)) {
            console.log('ℹ️ Demande déjà notifiée, ignorée:', newRequest.id);
            return;
          }
          
          console.log('✅ Nouvelle demande PENDING trouvée:', { 
            id: newRequest.id, 
            address: newRequest.address,
            status: newRequest.status 
          });
          
          // Marquer comme notifiée pour éviter les doublons
          notifiedRequestIds.add(newRequest.id);
          lastCheckedRequestId = newRequest.id;
          
          onNewRequest(newRequest.id, newRequest.address || 'Adresse non spécifiée');
        } else if (newRequest) {
          console.log('ℹ️ Nouvelle demande détectée mais status != pending:', {
            id: newRequest.id,
            status: newRequest.status
          });
        } else {
          console.warn('⚠️ Payload.new est vide, undefined ou sans id');
          console.warn('⚠️ Payload complet:', JSON.stringify(payload, null, 2));
        }
      }
    )
    .subscribe((status, err) => {
      console.log('📡 ===== STATUT ABONNEMENT REALTIME =====');
      console.log('📡 Statut:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ ✅ ✅ Abonnement Realtime ACTIF et PRÊT ✅ ✅ ✅');
        // Test de notification pour confirmer que les notifications fonctionnent
        setTimeout(async () => {
          try {
            await notificationService.showLocalNotification(
              '🔔 Écoute Realtime active',
              'Les notifications pour nouvelles demandes sont actives',
              { type: 'realtime_test' }
            );
          } catch (error) {
            console.error('❌ Erreur lors du test de notification:', error);
          }
        }, 2000);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erreur lors de l\'abonnement Realtime');
        if (err) {
          console.error('❌ Détails de l\'erreur:', err);
        }
        console.error('💡 Vérifiez que:');
        console.error('   1. Supabase Realtime est activé dans votre projet');
        console.error('   2. Les RLS (Row Level Security) permettent l\'écoute');
        console.error('   3. Votre connexion internet est active');
      } else if (status === 'TIMED_OUT') {
        console.warn('⏱️ Timeout lors de l\'abonnement Realtime');
        console.warn('💡 Vérifiez votre connexion internet');
      } else if (status === 'CLOSED') {
        console.warn('🔒 Canal Realtime fermé');
      } else {
        console.log('📡 Autre statut:', status);
      }
    });

  // Retourner une fonction de nettoyage
  return () => {
    console.log('🔕 Désabonnement de l\'écoute Realtime');
    try {
      supabase.removeChannel(channel);
      console.log('✅ Canal supprimé');
    } catch (error) {
      console.error('❌ Erreur lors du désabonnement:', error);
    }
    // Nettoyer l'intervalle de fallback
    clearInterval(fallbackInterval);
    console.log('✅ Système de fallback arrêté');
  };
}

/**
 * Initialise l'écoute Supabase Realtime pour les demandes acceptées par un prestataire
 * À utiliser dans le layout du client
 * 
 * @param clientCompanyId - L'ID de l'entreprise cliente
 * @param onRequestAccepted - Callback appelé lorsqu'une demande est acceptée
 * @returns Fonction de nettoyage pour désabonner
 */
export function setupRealtimeNotificationsForClients(
  clientCompanyId: string,
  onRequestAccepted: (requestId: string, providerName?: string) => void
): () => void {
  console.log('🔔 Configuration de l\'écoute Realtime pour les demandes acceptées...');
  console.log('📋 Table: wash_requests, Event: UPDATE, Status: accepted');
  console.log('👤 Client Company ID:', clientCompanyId);

  // Créer un canal unique pour éviter les conflits
  const channelName = `accepted-wash-requests-${Date.now()}`;
  console.log('📡 Nom du canal:', channelName);

  // Système de déduplication pour éviter les notifications multiples
  const notifiedRequestIds = new Set<string>();

  // S'abonner aux mises à jour dans wash_requests
  // On écoute tous les UPDATE et on filtre dans le callback
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'wash_requests',
        // Pas de filtre ici pour éviter les problèmes RLS - on filtrera dans le callback
      },
      (payload) => {
        console.log('📬 ===== MISE À JOUR DE DEMANDE DÉTECTÉE =====');
        console.log('📬 Payload:', payload);
        console.log('📬 Event:', payload.eventType);
        console.log('📬 New:', payload.new);
        console.log('📬 Old:', payload.old);
        
        const updatedRequest = payload.new as any;
        const oldRequest = payload.old as any;
        
        // Vérifier que :
        // 1. Le statut est passé à "accepted"
        // 2. La demande appartient au client connecté
        // 3. On ne l'a pas déjà notifiée
        if (
          updatedRequest &&
          updatedRequest.status === 'accepted' &&
          updatedRequest.client_company_id === clientCompanyId &&
          oldRequest?.status !== 'accepted' && // Le statut vient de changer
          !notifiedRequestIds.has(updatedRequest.id)
        ) {
          console.log('✅ Demande ACCEPTÉE trouvée:', { 
            id: updatedRequest.id, 
            address: updatedRequest.address,
            status: updatedRequest.status,
            providerId: updatedRequest.provider_id
          });
          
          // Marquer comme notifiée pour éviter les doublons
          notifiedRequestIds.add(updatedRequest.id);
          
          // Notifier le client (sans récupérer le nom du prestataire pour simplifier)
          onRequestAccepted(updatedRequest.id);
        } else if (updatedRequest) {
          console.log('ℹ️ Mise à jour détectée mais ignorée:', {
            id: updatedRequest.id,
            status: updatedRequest.status,
            clientCompanyId: updatedRequest.client_company_id,
            matchesClient: updatedRequest.client_company_id === clientCompanyId,
            alreadyNotified: notifiedRequestIds.has(updatedRequest.id),
            statusChanged: oldRequest?.status !== 'accepted'
          });
        } else {
          console.warn('⚠️ Payload.new est vide, undefined ou sans id');
        }
      }
    )
    .subscribe((status, err) => {
      console.log('📡 ===== STATUT ABONNEMENT REALTIME (CLIENT) =====');
      console.log('📡 Statut:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ ✅ ✅ Abonnement Realtime ACTIF et PRÊT (CLIENT) ✅ ✅ ✅');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erreur lors de l\'abonnement Realtime');
        if (err) {
          console.error('❌ Détails de l\'erreur:', err);
        }
        console.error('💡 Vérifiez que:');
        console.error('   1. Supabase Realtime est activé dans votre projet');
        console.error('   2. Les RLS (Row Level Security) permettent l\'écoute');
        console.error('   3. Votre connexion internet est active');
      } else if (status === 'TIMED_OUT') {
        console.warn('⏱️ Timeout lors de l\'abonnement Realtime');
        console.warn('💡 Vérifiez votre connexion internet');
      } else if (status === 'CLOSED') {
        console.warn('🔒 Canal Realtime fermé');
      } else {
        console.log('📡 Autre statut:', status);
      }
    });

  // Retourner une fonction de nettoyage
  return () => {
    console.log('🔕 Désabonnement de l\'écoute Realtime (CLIENT)');
    try {
      supabase.removeChannel(channel);
      console.log('✅ Canal supprimé');
    } catch (error) {
      console.error('❌ Erreur lors du désabonnement:', error);
    }
  };
}

/**
 * Initialise l'écoute Supabase Realtime pour les demandes annulées par un prestataire
 * À utiliser dans le layout du client
 * 
 * @param clientCompanyId - L'ID de l'entreprise cliente
 * @param onRequestCancelled - Callback appelé lorsqu'une demande est annulée
 * @returns Fonction de nettoyage pour désabonner
 */
export function setupRealtimeNotificationsForCancelledRequests(
  clientCompanyId: string,
  onRequestCancelled: (requestId: string) => void
): () => void {
  console.log('🔔 Configuration de l\'écoute Realtime pour les demandes annulées...');
  console.log('📋 Table: wash_requests, Event: UPDATE, Status: accepted -> pending');
  console.log('👤 Client Company ID:', clientCompanyId);

  // Créer un canal unique pour éviter les conflits
  const channelName = `cancelled-wash-requests-${Date.now()}`;
  console.log('📡 Nom du canal:', channelName);

  // Système de déduplication pour éviter les notifications multiples
  const notifiedRequestIds = new Set<string>();

  // S'abonner aux mises à jour dans wash_requests
  // On écoute tous les UPDATE et on filtre dans le callback
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'wash_requests',
        // Pas de filtre ici pour éviter les problèmes RLS - on filtrera dans le callback
      },
      (payload) => {
        console.log('📬 ===== MISE À JOUR DE DEMANDE DÉTECTÉE (ANNULATION) =====');
        console.log('📬 Payload:', payload);
        console.log('📬 Event:', payload.eventType);
        console.log('📬 New:', payload.new);
        console.log('📬 Old:', payload.old);
        
        const updatedRequest = payload.new as any;
        const oldRequest = payload.old as any;
        
        // Vérifier que :
        // 1. Le statut est passé de "accepted" à "pending" (annulation)
        // 2. Le provider_id est passé de quelque chose à null
        // 3. La demande appartient au client connecté
        // 4. On ne l'a pas déjà notifiée
        if (
          updatedRequest &&
          updatedRequest.status === 'pending' &&
          oldRequest?.status === 'accepted' && // Le statut vient de passer de accepted à pending
          updatedRequest.client_company_id === clientCompanyId &&
          oldRequest?.provider_id && // Il y avait un provider_id avant
          !updatedRequest.provider_id && // Plus de provider_id maintenant (annulation)
          !notifiedRequestIds.has(updatedRequest.id)
        ) {
          console.log('✅ Demande ANNULÉE trouvée:', { 
            id: updatedRequest.id, 
            address: updatedRequest.address,
            oldStatus: oldRequest?.status,
            newStatus: updatedRequest.status,
            oldProviderId: oldRequest?.provider_id,
            newProviderId: updatedRequest.provider_id
          });
          
          // Marquer comme notifiée pour éviter les doublons
          notifiedRequestIds.add(updatedRequest.id);
          
          // Notifier le client
          onRequestCancelled(updatedRequest.id);
        } else if (updatedRequest) {
          console.log('ℹ️ Mise à jour détectée mais ignorée (annulation):', {
            id: updatedRequest.id,
            oldStatus: oldRequest?.status,
            newStatus: updatedRequest.status,
            clientCompanyId: updatedRequest.client_company_id,
            matchesClient: updatedRequest.client_company_id === clientCompanyId,
            alreadyNotified: notifiedRequestIds.has(updatedRequest.id),
            statusChanged: oldRequest?.status === 'accepted' && updatedRequest.status === 'pending',
            providerRemoved: oldRequest?.provider_id && !updatedRequest.provider_id
          });
        } else {
          console.warn('⚠️ Payload.new est vide, undefined ou sans id (annulation)');
        }
      }
    )
    .subscribe((status, err) => {
      console.log('📡 ===== STATUT ABONNEMENT REALTIME (CLIENT - ANNULATION) =====');
      console.log('📡 Statut:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ ✅ ✅ Abonnement Realtime ACTIF et PRÊT (CLIENT - ANNULATION) ✅ ✅ ✅');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erreur lors de l\'abonnement Realtime');
        if (err) {
          console.error('❌ Détails de l\'erreur:', err);
        }
        console.error('💡 Vérifiez que:');
        console.error('   1. Supabase Realtime est activé dans votre projet');
        console.error('   2. Les RLS (Row Level Security) permettent l\'écoute');
        console.error('   3. Votre connexion internet est active');
      } else if (status === 'TIMED_OUT') {
        console.warn('⏱️ Timeout lors de l\'abonnement Realtime');
        console.warn('💡 Vérifiez votre connexion internet');
      } else if (status === 'CLOSED') {
        console.warn('🔒 Canal Realtime fermé');
      } else {
        console.log('📡 Autre statut:', status);
      }
    });

  // Retourner une fonction de nettoyage
  return () => {
    console.log('🔕 Désabonnement de l\'écoute Realtime (CLIENT - ANNULATION)');
    try {
      supabase.removeChannel(channel);
      console.log('✅ Canal supprimé');
    } catch (error) {
      console.error('❌ Erreur lors du désabonnement:', error);
    }
  };
}
