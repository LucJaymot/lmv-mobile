
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { WashRequest } from '@/types';

export default function ProviderJobsScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<'accepted' | 'in_progress' | 'completed'>('accepted');

  const jobs: WashRequest[] = [
    {
      id: '1',
      clientCompanyId: '1',
      providerId: '1',
      address: '123 Rue de la Paix, Paris',
      dateTime: new Date('2024-02-15T10:00:00'),
      status: 'accepted',
      createdAt: new Date(),
      vehicles: [],
      clientCompany: {
        id: '1',
        userId: '1',
        name: 'Garage Dupont',
        address: '123 Rue de la Paix, Paris',
        contact: 'Jean Dupont',
        phone: '+33 1 23 45 67 89',
        email: 'contact@garagedupont.fr',
      },
    },
    {
      id: '2',
      clientCompanyId: '2',
      providerId: '1',
      address: '456 Avenue des Champs, Paris',
      dateTime: new Date('2024-02-10T14:00:00'),
      status: 'completed',
      createdAt: new Date(),
      vehicles: [],
      clientCompany: {
        id: '2',
        userId: '2',
        name: 'Location Auto Pro',
        address: '456 Avenue des Champs, Paris',
        contact: 'Marie Martin',
        phone: '+33 1 98 76 54 32',
        email: 'contact@locationauto.fr',
      },
    },
  ];

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredJobs.length > 0 ? (
          <React.Fragment>
            {filteredJobs.map((job, index) => (
              <TouchableOpacity
                key={index}
                style={commonStyles.card}
                onPress={() => router.push(`/(provider)/requests/detail?id=${job.id}`)}
              >
                <View style={styles.jobHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                    <Text style={styles.statusText}>{getStatusLabel(job.status)}</Text>
                  </View>
                  <Text style={styles.jobDate}>{formatDate(job.dateTime)}</Text>
                </View>
                <Text style={styles.clientName}>{job.clientCompany?.name}</Text>
                <View style={styles.jobInfo}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location_on"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.jobAddress}>{job.address}</Text>
                </View>
                {job.status === 'accepted' && (
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.startButtonText}>Démarrer le lavage</Text>
                  </TouchableOpacity>
                )}
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
