
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/theme/hooks';
import { WashRequest, WashRequestStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { washRequestService, providerService } from '@/services/databaseService';

export default function RequestsScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const { theme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<WashRequestStatus | 'all'>('all');
  const [requests, setRequests] = useState<WashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      loadRequests();
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Mes demandes</Text>
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
              ]}
              onPress={() => setSelectedStatus(filter.value)}
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
        <View style={styles.loadingContainer}>
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
              {filteredRequests.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}
                  onPress={() => router.push(`/(client)/requests/detail?id=${request.id}`)}
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
                </TouchableOpacity>
              ))}
            </React.Fragment>
          ) : (
            <View style={styles.emptyState}>
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
});
