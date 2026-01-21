
import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { setupRealtimeNotificationsForClients, setupRealtimeNotificationsForCancelledRequests, notificationService } from '@/services/notificationService';

export default function ClientLayout() {
  const { user, isLoading, clientCompany } = useAuth();
  const router = useRouter();

  // Écouter les clics sur les notifications pour naviguer vers le détail
  useEffect(() => {
    // Écouter les interactions avec les notifications
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification cliquée (CLIENT):', response);
      const data = response.notification.request.content.data;
      
      // Si c'est une notification de demande acceptée ou annulée, ouvrir le détail
      if ((data?.type === 'request_accepted' || data?.type === 'request_cancelled') && data?.requestId) {
        console.log('🔗 Navigation vers le détail de la demande:', data.requestId);
        router.push(`/(client)/requests/detail?id=${data.requestId}`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Écouter les demandes acceptées et afficher des notifications locales
  useEffect(() => {
    if (!user || user.role !== 'client' || !clientCompany) {
      console.log('⚠️ Utilisateur non client ou entreprise manquante, pas d\'écoute Realtime');
      return;
    }

    console.log('👤 Client connecté, configuration des notifications...');
    console.log('🏢 Client Company ID:', clientCompany.id);

    // Vérifier les permissions de notification
    notificationService.requestPermissions().then((granted) => {
      if (granted) {
        console.log('✅ Permissions de notification accordées (CLIENT)');
      } else {
        console.warn('⚠️ Permissions de notification refusées (CLIENT)');
      }
    });

    // Configurer l'écoute Realtime pour les demandes acceptées
    console.log('🔔 Initialisation de l\'écoute Realtime (CLIENT - ACCEPTATION)...');
    const cleanupAccepted = setupRealtimeNotificationsForClients(
      clientCompany.id,
      async (requestId) => {
        console.log('🔔 ===== CALLBACK DEMANDE ACCEPTÉE DÉCLENCHÉ =====');
        console.log('🔔 RequestId:', requestId);
        
        try {
          // Vérifier les permissions avant d'afficher
          const hasPermission = await notificationService.requestPermissions();
          if (!hasPermission) {
            console.warn('⚠️ Permissions de notification refusées, impossible d\'afficher la notification');
            return;
          }

          // Afficher une notification locale
          console.log('📱 Affichage de la notification locale (CLIENT - ACCEPTATION)...');
          await notificationService.showLocalNotification(
            'Demande acceptée',
            'Votre demande de lavage a été acceptée par un prestataire',
            {
              type: 'request_accepted',
              requestId,
            }
          );
          console.log('✅ ✅ ✅ Notification locale affichée avec succès (CLIENT - ACCEPTATION) ✅ ✅ ✅');
        } catch (error: any) {
          console.error('❌ ❌ ❌ Erreur lors de l\'affichage de la notification (CLIENT - ACCEPTATION) ❌ ❌ ❌');
          console.error('❌ Erreur:', error);
          console.error('❌ Message:', error?.message);
          console.error('❌ Stack:', error?.stack);
        }
      }
    );

    // Configurer l'écoute Realtime pour les demandes annulées
    console.log('🔔 Initialisation de l\'écoute Realtime (CLIENT - ANNULATION)...');
    const cleanupCancelled = setupRealtimeNotificationsForCancelledRequests(
      clientCompany.id,
      async (requestId) => {
        console.log('🔔 ===== CALLBACK DEMANDE ANNULÉE DÉCLENCHÉ =====');
        console.log('🔔 RequestId:', requestId);
        
        try {
          // Vérifier les permissions avant d'afficher
          const hasPermission = await notificationService.requestPermissions();
          if (!hasPermission) {
            console.warn('⚠️ Permissions de notification refusées, impossible d\'afficher la notification');
            return;
          }

          // Afficher une notification locale
          console.log('📱 Affichage de la notification locale (CLIENT - ANNULATION)...');
          await notificationService.showLocalNotification(
            'Demande annulée',
            'Le prestataire a annulé votre demande de lavage',
            {
              type: 'request_cancelled',
              requestId,
            }
          );
          console.log('✅ ✅ ✅ Notification locale affichée avec succès (CLIENT - ANNULATION) ✅ ✅ ✅');
        } catch (error: any) {
          console.error('❌ ❌ ❌ Erreur lors de l\'affichage de la notification (CLIENT - ANNULATION) ❌ ❌ ❌');
          console.error('❌ Erreur:', error);
          console.error('❌ Message:', error?.message);
          console.error('❌ Stack:', error?.stack);
        }
      }
    );

    // Nettoyer les abonnements lors du démontage
    return () => {
      console.log('🧹 Nettoyage de l\'écoute Realtime (CLIENT)');
      cleanupAccepted();
      cleanupCancelled();
    };
  }, [user, clientCompany]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== 'client') {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="vehicles/add" options={{ presentation: 'modal', headerShown: true, title: 'Ajouter un véhicule' }} />
      <Stack.Screen name="vehicles/edit" options={{ presentation: 'modal', headerShown: true, title: 'Modifier le véhicule' }} />
      <Stack.Screen name="requests/create" options={{ presentation: 'modal', headerShown: true, title: 'Nouvelle demande' }} />
      <Stack.Screen name="requests/detail" options={{ presentation: 'modal', headerShown: true, title: 'Détail de la demande' }} />
      <Stack.Screen name="profile/edit" options={{ presentation: 'modal', headerShown: true, title: 'Modifier le profil' }} />
      <Stack.Screen name="profile/notifications" options={{ presentation: 'modal', headerShown: true, title: 'Notifications' }} />
      <Stack.Screen name="profile/test-notifications" options={{ presentation: 'modal', headerShown: false, title: 'Test des Notifications' }} />
      <Stack.Screen name="invoices/index" options={{ presentation: 'modal', headerShown: true, title: 'Factures' }} />
    </Stack>
  );
}
