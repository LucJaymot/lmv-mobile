
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/theme/hooks';
import { WashRequest, WashRequestStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { washRequestService, providerService } from '@/services/databaseService';
import { useWebAnimations } from '@/hooks/useWebAnimations';

export default function RequestsScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const { theme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<WashRequestStatus | 'all'>('all');
  const [requests, setRequests] = useState<WashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastLoadTimeRef = useRef<number>(0);
  const { getDataAttribute } = useWebAnimations('requests');

  const loadRequests = async () => {
    if (!clientCompany) {
      setIsLoading(false);
      return;
    }

    try {
      // Mettre à jour les demandes pending expirées avant de charger
      await washRequestService.updateExpiredPendingRequests(clientCompany.id);
      
      // Mettre à jour les demandes acceptées expirées avant de charger
      await washRequestService.updateExpiredAcceptedRequests(clientCompany.id);
      
      console.log('Chargement des demandes pour:', clientCompany.id);
      const requestsData = await washRequestService.getByClientCompanyId(clientCompany.id);
      console.log('Demandes chargées:', requestsData.length);

      // Charger les informations des prestataires pour chaque demande
      const requestsWithProviders = await Promise.all(
        requestsData.map(async (request) => {
          if (request.providerId) {
            try {
              const provider = await providerService.getById(request.providerId);
              return { ...request, provider: provider || undefined };
            } catch (error) {
              console.error('Erreur lors du chargement du prestataire:', error);
              return request;
            }
          }
          return request;
        })
      );

      setRequests(requestsWithProviders);
      lastLoadTimeRef.current = Date.now();
    } catch (error: any) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [clientCompany]);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Ne recharger que si les données ont plus de 30 secondes
      if (now - lastLoadTimeRef.current > 30000) {
        loadRequests();
      }
    }, [clientCompany])
  );

  const filteredRequests = selectedStatus === 'all'
    ? requests
    : requests.filter(r => r.status === selectedStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning; // Orange/Jaune pour l'attente
      case 'accepted':
        return theme.colors.accent; // Couleur de marque (#002B39) pour l'acceptation
      case 'in_progress':
        return theme.colors.accent; // Couleur de marque (#002B39) pour le progrès
      case 'completed':
        return theme.colors.success; // Vert pour la réussite
      case 'cancelled':
        return theme.colors.error; // Rouge pour l'annulation
      default:
        return theme.colors.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Accepté';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
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

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'exterior':
        return 'Extérieur';
      case 'interior':
        return 'Intérieur';
      case 'complete':
        return 'Complet';
      default:
        return serviceType;
    }
  };

  const getServiceTypesForRequest = (request: WashRequest): string => {
    if (!request.vehicles || request.vehicles.length === 0) {
      return 'Aucun véhicule';
    }
    
    // Récupérer tous les types de service uniques
    const serviceTypes = request.vehicles.map(v => v.serviceType);
    const uniqueServiceTypes = [...new Set(serviceTypes)];
    
    // Si tous les véhicules ont le même type de service, afficher une seule fois
    if (uniqueServiceTypes.length === 1) {
      return getServiceTypeLabel(uniqueServiceTypes[0]);
    }
    
    // Sinon, afficher tous les types séparés par des virgules
    return uniqueServiceTypes.map(st => getServiceTypeLabel(st)).join(', ');
  };

  const statusFilters: { value: WashRequestStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'accepted', label: 'Accepté' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header} {...getDataAttribute('header')}>
        <Text style={[styles.title, { color: theme.colors.text }]} {...getDataAttribute('title')}>
          Mes demandes
        </Text>
      </View>

      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {statusFilters.map((filter, index) => {
            const isActive = selectedStatus === filter.value;
            return (
            <TouchableOpacity
              key={index}
              style={[
                styles.filterChip,
                {
                  borderColor: isActive ? theme.colors.accent : theme.colors.border,
                  backgroundColor: isActive ? theme.colors.accent : theme.colors.surface,
                },
                Platform.OS === 'web' && {
                  animationDelay: `${0.2 + index * 0.05}s`,
                } as any,
              ]}
              onPress={() => setSelectedStatus(filter.value)}
              {...getDataAttribute('filter')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isActive ? '#FFFFFF' : theme.colors.text,
                  },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer} {...getDataAttribute('loading')}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement des demandes...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredRequests.length > 0 ? (
            <React.Fragment>
              {filteredRequests.map((request, index) => (
                <TouchableOpacity
                  key={request.id}
                  style={[
                    commonStyles.card, 
                    { backgroundColor: theme.colors.surface },
                    Platform.OS === 'web' && styles.webCard,
                    Platform.OS === 'web' && {
                      animationDelay: `${0.2 + index * 0.1}s`,
                    } as any,
                  ]}
                  onPress={() => router.push(`/(client)/requests/detail?id=${request.id}`)}
                  {...getDataAttribute('card')}
                >
                  <View style={styles.requestHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(request.status)}</Text>
                    </View>
                    <Text style={[styles.requestDate, { color: theme.colors.textMuted }]}>{formatDate(request.dateTime)}</Text>
                  </View>
                  {request.provider && (
                    <Text style={[styles.providerName, { color: theme.colors.text }]}>{request.provider.name}</Text>
                  )}
                  <View style={styles.requestInfo}>
                    <IconSymbol
                      ios_icon_name="location.fill"
                      android_material_icon_name="location-on"
                      size={16}
                      color={theme.colors.textMuted}
                    />
                    <Text style={[styles.requestAddress, { color: theme.colors.textMuted }]}>{request.address}</Text>
                  </View>
                  {request.vehicles && request.vehicles.length > 0 && (
                    <View style={[styles.serviceTypeContainer, { borderTopColor: theme.colors.border }]}>
                      <IconSymbol
                        ios_icon_name="car.fill"
                        android_material_icon_name="directions-car"
                        size={16}
                        color={theme.colors.text}
                      />
                      <Text style={[styles.serviceTypeText, { color: theme.colors.text }]}>
                        {getServiceTypesForRequest(request)}
                      </Text>
                      <Text style={[styles.vehicleCount, { color: theme.colors.textMuted }]}>
                        ({request.vehicles.length} {request.vehicles.length === 1 ? 'véhicule' : 'véhicules'})
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </React.Fragment>
          ) : (
            <View style={styles.emptyState} {...getDataAttribute('empty-state')}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={64}
                color={theme.colors.textMuted}
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>Aucune demande</Text>
            </View>
          )}
        </ScrollView>
      )}
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
  },
  filtersWrapper: {
    paddingBottom: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
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
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestAddress: {
    fontSize: 14,
    flex: 1,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  serviceTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleCount: {
    fontSize: 13,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  webCard: {
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
    } : {}),
  },
});
