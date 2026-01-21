
import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { setupRealtimeNotificationsForProviders, notificationService } from '@/services/notificationService';

export default function ProviderLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Écouter les clics sur les notifications pour naviguer vers le détail
  useEffect(() => {
    // Écouter les interactions avec les notifications
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification cliquée:', response);
      const data = response.notification.request.content.data;
      
      // Si c'est une notification de nouvelle demande, ouvrir le détail
      if (data?.type === 'new_request' && data?.requestId) {
        console.log('🔗 Navigation vers le détail de la demande:', data.requestId);
        router.push(`/(provider)/requests/detail?id=${data.requestId}`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Écouter les nouvelles demandes et afficher des notifications locales
  useEffect(() => {
    if (!user || user.role !== 'provider') {
      console.log('⚠️ Utilisateur non prestataire, pas d\'écoute Realtime');
      return;
    }

    console.log('👤 Prestataire connecté, configuration des notifications...');

    // Vérifier les permissions de notification
    notificationService.requestPermissions().then((granted) => {
      if (granted) {
        console.log('✅ Permissions de notification accordées');
      } else {
        console.warn('⚠️ Permissions de notification refusées');
      }
    });

    // Configurer l'écoute Realtime pour les nouvelles demandes
    console.log('🔔 Initialisation de l\'écoute Realtime...');
    const cleanup = setupRealtimeNotificationsForProviders(async (requestId, address) => {
      console.log('🔔 ===== CALLBACK NOUVELLE DEMANDE DÉCLENCHÉ =====');
      console.log('🔔 RequestId:', requestId);
      console.log('🔔 Address:', address);
      
      try {
        // Vérifier les permissions avant d'afficher
        const hasPermission = await notificationService.requestPermissions();
        if (!hasPermission) {
          console.warn('⚠️ Permissions de notification refusées, impossible d\'afficher la notification');
          return;
        }

        // Afficher une notification locale
        console.log('📱 Affichage de la notification locale...');
        await notificationService.showLocalNotification(
          'Nouvelle demande de lavage',
          `Nouvelle demande disponible à ${address}`,
          {
            type: 'new_request',
            requestId,
            address,
          }
        );
        console.log('✅ ✅ ✅ Notification locale affichée avec succès ✅ ✅ ✅');
      } catch (error: any) {
        console.error('❌ ❌ ❌ Erreur lors de l\'affichage de la notification ❌ ❌ ❌');
        console.error('❌ Erreur:', error);
        console.error('❌ Message:', error?.message);
        console.error('❌ Stack:', error?.stack);
      }
    });

    // Nettoyer l'abonnement lors du démontage
    return () => {
      console.log('🧹 Nettoyage de l\'écoute Realtime');
      cleanup();
    };
  }, [user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || user.role !== 'provider') {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="requests/detail" options={{ presentation: 'modal', headerShown: true, title: 'Détail de la demande' }} />
      <Stack.Screen name="profile/edit" options={{ presentation: 'modal', headerShown: true, title: 'Modifier le profil' }} />
      <Stack.Screen name="profile/notifications" options={{ presentation: 'modal', headerShown: true, title: 'Notifications' }} />
      <Stack.Screen name="invoices/index" options={{ presentation: 'modal', headerShown: true, title: 'Factures' }} />
    </Stack>
  );
}
