
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { commonStyles } from '@/styles/commonStyles';
import { useTheme } from '@/theme/hooks';
import { IconSymbol } from '@/components/IconSymbol';
import { Button } from '@/components/ui/Button';
import { WashRequest } from '@/types';
import { washRequestService } from '@/services/databaseService';
import { useAuth } from '@/contexts/AuthContextSupabase';

export default function ProviderRequestsScreen() {
  const router = useRouter();
  const { provider } = useAuth();
  const { theme } = useTheme();
  const [pendingRequests, setPendingRequests] = useState<WashRequest[]>([]);
  const [cancelledRequestIds, setCancelledRequestIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);

  const loadPendingRequests = async () => {
    setIsLoading(true);
    console.log('📥 Chargement des demandes en attente...');
    try {
      const result = await washRequestService.getPendingRequests(provider?.id);
      // Filtrer uniquement les demandes avec le statut "pending" et qui ne sont pas annulées
      const filteredRequests = result.requests.filter(
        request => request.status === 'pending' && !result.cancelledIds.includes(request.id)
      );
      setPendingRequests(filteredRequests);
      setCancelledRequestIds(new Set(result.cancelledIds));
      console.log('📥 Demandes chargées:', filteredRequests.length);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des demandes en attente:', error);
      Alert.alert('Erreur', 'Impossible de charger les demandes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPendingRequests();
    }, [])
  );

  const handleAcceptRequest = async (requestId: string) => {
    if (!provider?.id) {
      Alert.alert('Erreur', 'Impossible d\'accepter la demande: ID prestataire manquant.');
      return;
    }

    const confirmAccept = Platform.OS === 'web' ?
      window.confirm('Voulez-vous vraiment accepter cette demande ?') :
      await new Promise(resolve => {
        Alert.alert(
          'Accepter la demande',
          'Voulez-vous vraiment accepter cette demande ?',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Accepter', style: 'default', onPress: () => resolve(true) },
          ]
        );
      });

    if (!confirmAccept) {
      return;
    }

    try {
      setAcceptingRequestId(requestId);
      console.log('✅ Acceptation de la demande:', requestId);
      console.log('✅ Provider ID:', provider.id);

      await washRequestService.update(requestId, {
        providerId: provider.id,
        status: 'accepted',
      });

      console.log('✅ Demande acceptée avec succès');
      
      // Rediriger vers la page précédente
      router.back();
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'acceptation de la demande:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'accepter la demande');
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (isCancelled: boolean) => {
    if (isCancelled) {
      return theme.colors.error; // Rouge pour l'annulation
    }
    return theme.colors.warning; // Orange/Jaune pour l'attente (nouveau)
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Nouvelles demandes</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Dans votre zone d&apos;intervention</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement...</Text>
          </View>
        ) : pendingRequests.length > 0 ? (
          <React.Fragment>
            {pendingRequests.map((request) => {
              const isCancelled = cancelledRequestIds.has(request.id);
              return (
                <View key={request.id} style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.requestHeader}>
                  <Text style={[styles.clientName, { color: theme.colors.text }]}>{request.clientCompany?.name || 'Client inconnu'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(isCancelled) }]}>
                    <Text style={styles.statusText}>{isCancelled ? 'Annulé' : 'Nouveau'}</Text>
                  </View>
                </View>
                <Text style={[styles.requestDate, { color: theme.colors.text }]}>{formatDate(request.dateTime)}</Text>
                <View style={styles.requestInfo}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={16}
                    color={theme.colors.textMuted}
                  />
                  <Text style={[styles.requestAddress, { color: theme.colors.textMuted }]}>{request.address}</Text>
                </View>
                {request.clientCompany?.phone && (
                  <View style={styles.requestInfo}>
                    <IconSymbol
                      ios_icon_name="phone.fill"
                      android_material_icon_name="phone"
                      size={16}
                      color={theme.colors.textMuted}
                    />
                    <Text style={[styles.requestPhone, { color: theme.colors.textMuted }]}>{request.clientCompany.phone}</Text>
                  </View>
                )}
                {request.vehicles && request.vehicles.length > 0 && (
                  <View style={styles.requestInfo}>
                    <IconSymbol
                      ios_icon_name="car.fill"
                      android_material_icon_name="directions-car"
                      size={16}
                      color={theme.colors.textMuted}
                    />
                    <Text style={[styles.requestPhone, { color: theme.colors.textMuted }]}>
                      {request.vehicles.length} véhicule{request.vehicles.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {!isCancelled && (
                  <View style={[styles.requestActions, { borderTopColor: theme.colors.border }]}>
                    <Button
                      variant="ghost"
                      size="md"
                      onPress={() => router.push(`/(provider)/requests/detail?id=${request.id}`)}
                      style={styles.detailsButton}
                      textStyle={{ color: theme.colors.text }}
                    >
                      Voir détails
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onPress={() => handleAcceptRequest(request.id)}
                      disabled={acceptingRequestId === request.id}
                      loading={acceptingRequestId === request.id}
                      style={styles.acceptButton}
                    >
                      Accepter
                    </Button>
                  </View>
                )}
                </View>
              );
            })}
          </React.Fragment>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="tray"
              android_material_icon_name="inbox"
              size={64}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>Aucune nouvelle demande</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textMuted }]}>
              Les demandes dans votre zone apparaîtront ici
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  requestAddress: {
    fontSize: 14,
    flex: 1,
  },
  requestPhone: {
    fontSize: 14,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  detailsButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
