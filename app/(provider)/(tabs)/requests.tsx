
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
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { WashRequest } from '@/types';
import { washRequestService } from '@/services/databaseService';
import { useAuth } from '@/contexts/AuthContextSupabase';

export default function ProviderRequestsScreen() {
  const router = useRouter();
  const { provider } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<WashRequest[]>([]);
  const [cancelledRequestIds, setCancelledRequestIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);

  const loadPendingRequests = async () => {
    setIsLoading(true);
    console.log('📥 Chargement des demandes en attente...');
    try {
      const result = await washRequestService.getPendingRequests(provider?.id);
      setPendingRequests(result.requests);
      setCancelledRequestIds(new Set(result.cancelledIds));
      console.log('📥 Demandes chargées:', result.requests.length);
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
      await loadPendingRequests(); // Recharger les demandes
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Nouvelles demandes</Text>
        <Text style={styles.subtitle}>Dans votre zone d&apos;intervention</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : pendingRequests.length > 0 ? (
          <React.Fragment>
            {pendingRequests.map((request) => {
              const isCancelled = cancelledRequestIds.has(request.id);
              return (
                <View key={request.id} style={commonStyles.card}>
                <View style={styles.requestHeader}>
                  <Text style={styles.clientName}>{request.clientCompany?.name || 'Client inconnu'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: isCancelled ? colors.error : colors.warning }]}>
                    <Text style={styles.statusText}>{isCancelled ? 'Annulé' : 'Nouveau'}</Text>
                  </View>
                </View>
                <Text style={styles.requestDate}>{formatDate(request.dateTime)}</Text>
                <View style={styles.requestInfo}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.requestAddress}>{request.address}</Text>
                </View>
                {request.clientCompany?.phone && (
                  <View style={styles.requestInfo}>
                    <IconSymbol
                      ios_icon_name="phone.fill"
                      android_material_icon_name="phone"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.requestPhone}>{request.clientCompany.phone}</Text>
                  </View>
                )}
                {request.vehicles && request.vehicles.length > 0 && (
                  <View style={styles.requestInfo}>
                    <IconSymbol
                      ios_icon_name="car.fill"
                      android_material_icon_name="directions-car"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.requestPhone}>
                      {request.vehicles.length} véhicule{request.vehicles.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {!isCancelled && (
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[buttonStyles.outline, styles.detailsButton]}
                      onPress={() => router.push(`/(provider)/requests/detail?id=${request.id}`)}
                    >
                      <Text style={commonStyles.buttonTextOutline}>Voir détails</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        buttonStyles.accent,
                        styles.acceptButton,
                        acceptingRequestId === request.id && styles.buttonDisabled
                      ]}
                      onPress={() => handleAcceptRequest(request.id)}
                      disabled={acceptingRequestId === request.id}
                    >
                      {acceptingRequestId === request.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={commonStyles.buttonText}>Accepter</Text>
                      )}
                    </TouchableOpacity>
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
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucune nouvelle demande</Text>
            <Text style={styles.emptySubtext}>
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
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
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
    color: colors.text,
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
    color: colors.textSecondary,
    flex: 1,
  },
  requestPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
