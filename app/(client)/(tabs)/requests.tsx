
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
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { WashRequest, WashRequestStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { washRequestService, providerService } from '@/services/databaseService';

export default function RequestsScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<WashRequestStatus | 'all'>('all');
  const [requests, setRequests] = useState<WashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    if (!clientCompany) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Chargement des demandes pour:', clientCompany.id);
      const requestsData = await washRequestService.getByClientCompanyId(clientCompany.id);
      console.log('Demandes chargées:', requestsData.length);

      // Charger les informations des prestataires pour chaque demande
      const requestsWithProviders = await Promise.all(
        requestsData.map(async (request) => {
          if (request.providerId) {
            try {
              const provider = await providerService.getById(request.providerId);
              return { ...request, provider };
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
        return colors.warning;
      case 'accepted':
        return colors.info;
      case 'in_progress':
        return colors.primary;
      case 'completed':
        return colors.accent;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes demandes</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {statusFilters.map((filter, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterChip,
              selectedStatus === filter.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(filter.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des demandes...</Text>
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
                  style={commonStyles.card}
                  onPress={() => router.push(`/(client)/requests/detail?id=${request.id}`)}
                >
                  <View style={styles.requestHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(request.status)}</Text>
                    </View>
                    <Text style={styles.requestDate}>{formatDate(request.dateTime)}</Text>
                  </View>
                  {request.provider && (
                    <Text style={styles.providerName}>{request.provider.name}</Text>
                  )}
                  <View style={styles.requestInfo}>
                    <IconSymbol
                      ios_icon_name="location.fill"
                      android_material_icon_name="location-on"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.requestAddress}>{request.address}</Text>
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
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>Aucune demande</Text>
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
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
    color: colors.textSecondary,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
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
    color: colors.textSecondary,
  },
});
