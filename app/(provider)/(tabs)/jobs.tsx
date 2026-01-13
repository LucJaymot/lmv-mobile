
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
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { WashRequest } from '@/types';
import { washRequestService } from '@/services/databaseService';

export default function ProviderJobsScreen() {
  const router = useRouter();
  const { provider } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'in_progress' | 'completed'>('accepted');
  const [jobs, setJobs] = useState<WashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadJobs = async () => {
    if (!provider) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Mettre à jour automatiquement les demandes expirées
      await washRequestService.updateExpiredRequests();
      // Charger les jobs du provider
      const requests = await washRequestService.getByProviderId(provider.id);
      setJobs(requests);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [provider]);

  useFocusEffect(
    React.useCallback(() => {
      loadJobs();
    }, [provider])
  );

  const filteredJobs = jobs.filter(j => j.status === selectedStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return colors.info;
      case 'in_progress':
        return colors.primary;
      case 'completed':
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepté';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
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

  const statusFilters: { value: 'accepted' | 'in_progress' | 'completed'; label: string }[] = [
    { value: 'accepted', label: 'Accepté' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes jobs</Text>
      </View>

      <View style={styles.filtersWrapper}>
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
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredJobs.length > 0 ? (
          <React.Fragment>
            {filteredJobs.map((job, index) => (
              <TouchableOpacity
                key={job.id || index}
                style={commonStyles.card}
                onPress={() => router.push(`/(provider)/requests/detail?id=${job.id}`)}
              >
                <View style={styles.jobHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(job.status)}</Text>
                  </View>
                  <Text style={styles.jobDate}>{formatDate(job.dateTime)}</Text>
                </View>
                <Text style={styles.clientName}>{job.clientCompany?.name || 'Client inconnu'}</Text>
                <View style={styles.jobInfo}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.jobAddress}>{job.address}</Text>
                </View>
                {job.status === 'in_progress' && (
                  <TouchableOpacity style={styles.completeButton}>
                    <Text style={styles.completeButtonText}>Marquer comme terminé</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </React.Fragment>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="briefcase"
              android_material_icon_name="work"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucun job {getStatusLabel(selectedStatus).toLowerCase()}</Text>
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
    borderColor: colors.border,
    backgroundColor: colors.card,
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
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
  jobHeader: {
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
  jobDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
});
