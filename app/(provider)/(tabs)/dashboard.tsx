
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
import { Logo } from '@/components/Logo';
import { WashRequest } from '@/types';
import { washRequestService } from '@/services/databaseService';

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const { provider } = useAuth();
  const [todayJobs, setTodayJobs] = useState<WashRequest[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const loadProviderJobs = async () => {
    if (!provider) {
      setIsLoadingJobs(false);
      return;
    }

    try {
      setIsLoadingJobs(true);
      console.log('📥 Chargement des jobs du provider:', provider.id);
      const requests = await washRequestService.getByProviderId(provider.id);
      console.log('📥 Jobs chargés:', requests.length);
      
      // Obtenir la date du jour (aujourd'hui) à minuit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Filtrer pour n'afficher que les jobs acceptés pour la date du jour
      const acceptedJobs = requests
        .filter(req => {
          const jobDate = new Date(req.dateTime);
          jobDate.setHours(0, 0, 0, 0);
          const isToday = jobDate.getTime() >= today.getTime() && jobDate.getTime() < tomorrow.getTime();
          return (req.status === 'accepted' || req.status === 'in_progress') && isToday;
        })
        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()); // Trier par date croissante
      
      setTodayJobs(acceptedJobs);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadProviderJobs();
  }, [provider]);

  useFocusEffect(
    React.useCallback(() => {
      loadProviderJobs();
    }, [provider])
  );

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.providerName}>{provider?.name}</Text>
          </View>
          <Logo size="sm" />
        </View>

        {/* TEMPORAIREMENT CACHÉ - À réactiver plus tard */}
        {false && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={32}
                color={colors.highlight}
              />
              <Text style={styles.statValue}>{provider?.averageRating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
            <View style={styles.statCard}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.statValue}>{provider?.totalRatings || 0}</Text>
              <Text style={styles.statLabel}>Avis reçus</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jobs du jour</Text>
          {isLoadingJobs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : todayJobs.length > 0 ? (
            <React.Fragment>
              {todayJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={commonStyles.card}
                  onPress={() => router.push(`/(provider)/requests/detail?id=${job.id}`)}
                >
                  <View style={styles.requestHeader}>
                    <Text style={styles.clientName}>{job.clientCompany?.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: job.status === 'accepted' ? colors.info : colors.primary }]}>
                      <Text style={styles.statusText}>
                        {job.status === 'accepted' ? 'Accepté' : job.status === 'in_progress' ? 'En cours' : job.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.requestDate}>{formatDate(job.dateTime)}</Text>
                  <View style={styles.requestInfo}>
                    <IconSymbol
                      ios_icon_name="location.fill"
                      android_material_icon_name="location-on"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.requestAddress}>{job.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </React.Fragment>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>Aucun job prévu</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
    color: colors.textSecondary,
    marginBottom: 8,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  requestAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
