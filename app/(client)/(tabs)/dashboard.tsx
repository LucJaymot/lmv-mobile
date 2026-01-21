
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
import { useAuth } from '@/contexts/AuthContextSupabase';
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/theme/hooks';
import { WashRequest } from '@/types';
import { washRequestService, providerService } from '@/services/databaseService';

export default function ClientDashboardScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const { theme } = useTheme();
  const [recentWashes, setRecentWashes] = useState<WashRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastLoadTimeRef = useRef<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Injecter les animations CSS pour web uniquement
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'dashboard-animations';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        [data-dashboard-header] {
          animation: fadeInUp 0.6s ease-out;
        }
        
        [data-dashboard-button] {
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }
        
        [data-dashboard-button] > div[role="button"] {
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          cursor: pointer;
        }
        
        [data-dashboard-button]:hover > div[role="button"] {
          transform: translateY(-2px) scale(1.02) !important;
          box-shadow: 0 8px 20px rgba(0, 43, 57, 0.25) !important;
        }
        
        [data-dashboard-section-title] {
          animation: fadeInUp 0.6s ease-out 0.3s both;
        }
        
        [data-dashboard-card] {
          animation: fadeInUp 0.5s ease-out both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        [data-dashboard-card]:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        
        [data-dashboard-empty-state] {
          animation: fadeIn 0.6s ease-out 0.4s both;
        }
        
        [data-dashboard-loading] {
          animation: fadeIn 0.3s ease-out;
        }
      `;
      
      setIsMounted(true);
      
      return () => {
        // Ne pas supprimer le style car il peut être réutilisé
      };
    } else {
      setIsMounted(true);
    }
  }, []);

  const loadWashRequests = async () => {
    if (!clientCompany) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Chargement des demandes de lavage pour:', clientCompany.id);
      const requests = await washRequestService.getByClientCompanyId(clientCompany.id);
      console.log('Demandes chargées:', requests.length);

      // Charger les informations des prestataires pour chaque demande
      const requestsWithProviders = await Promise.all(
        requests.map(async (request) => {
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

      // Filtrer les lavages en attente (pending)
      const pendingWashes = requestsWithProviders
        .filter(req => req.status === 'pending')
        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()) // Trier par date croissante (les plus proches en premier)
        .map(req => ({ ...req, provider: req.provider || undefined })) as WashRequest[];

      setRecentWashes(pendingWashes);
      lastLoadTimeRef.current = Date.now();
    } catch (error: any) {
      console.error('Erreur lors du chargement des demandes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les demandes au montage
  useEffect(() => {
    loadWashRequests();
  }, [clientCompany]);

  // Recharger quand on revient sur la page (avec cache de 30s)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Ne recharger que si les données ont plus de 30 secondes
      if (now - lastLoadTimeRef.current > 30000) {
        loadWashRequests();
      }
    }, [clientCompany])
  );

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

  const getServiceTypesForRequest = (wash: WashRequest): string => {
    if (!wash.vehicles || wash.vehicles.length === 0) {
      return 'Aucun véhicule';
    }
    
    // Récupérer tous les types de service uniques
    const serviceTypes = wash.vehicles.map(v => v.serviceType);
    const uniqueServiceTypes = [...new Set(serviceTypes)];
    
    // Si tous les véhicules ont le même type de service, afficher une seule fois
    if (uniqueServiceTypes.length === 1) {
      return getServiceTypeLabel(uniqueServiceTypes[0]);
    }
    
    // Sinon, afficher tous les types séparés par des virgules
    return uniqueServiceTypes.map(st => getServiceTypeLabel(st)).join(', ');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View 
          style={styles.loadingContainer}
          {...(Platform.OS === 'web' ? { 'data-dashboard-loading': true } : {})}
        >
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View 
          style={styles.header}
          {...(Platform.OS === 'web' ? { 'data-dashboard-header': true } : {})}
        >
          <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: theme.colors.textMuted }]}>Bonjour,</Text>
          <Text style={[styles.companyName, { color: theme.colors.text }]}>{clientCompany?.name}</Text>
          </View>
          <Logo size="sm" />
        </View>

        <View
          {...(Platform.OS === 'web' ? { 'data-dashboard-button': true } : {})}
        >
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.push('/(client)/requests/create')}
            style={styles.createButton}
          >
            Nouvelle demande de lavage
          </Button>
        </View>

        <View style={styles.section}>
          <Text 
            style={[styles.sectionTitle, { color: theme.colors.text }]}
            {...(Platform.OS === 'web' ? { 'data-dashboard-section-title': true } : {})}
          >
            Prochains lavages
          </Text>
          {recentWashes.length > 0 ? (
            <React.Fragment>
              {recentWashes.map((wash, index) => (
                <TouchableOpacity
                  key={wash.id}
                  style={[
                    commonStyles.card, 
                    { backgroundColor: theme.colors.surface },
                    Platform.OS === 'web' && styles.webCard,
                    Platform.OS === 'web' && {
                      animationDelay: `${0.4 + index * 0.1}s`,
                    } as any,
                  ]}
                  onPress={() => router.push(`/(client)/requests/detail?id=${wash.id}`)}
                  {...(Platform.OS === 'web' ? { 'data-dashboard-card': true } : {})}
                >
                  <View style={styles.washHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(wash.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(wash.status)}</Text>
                    </View>
                    <Text style={[styles.washDate, { color: theme.colors.textMuted }]}>{formatDate(wash.dateTime)}</Text>
                  </View>
                  {wash.provider?.name && (
                    <Text style={[styles.providerName, { color: theme.colors.text }]}>{wash.provider.name}</Text>
                  )}
                  <View style={styles.washInfo}>
                    <IconSymbol
                      ios_icon_name="location.fill"
                      android_material_icon_name="location-on"
                      size={16}
                      color={theme.colors.textMuted}
                    />
                    <Text style={[styles.washAddress, { color: theme.colors.textMuted }]}>{wash.address}</Text>
                  </View>
                  {wash.vehicles && wash.vehicles.length > 0 && (
                    <View style={[styles.serviceTypeContainer, { borderTopColor: theme.colors.border }]}>
                      <IconSymbol
                        ios_icon_name="car.fill"
                        android_material_icon_name="directions-car"
                        size={16}
                        color={theme.colors.text}
                      />
                      <Text style={[styles.serviceTypeText, { color: theme.colors.text }]}>
                        {getServiceTypesForRequest(wash)}
                      </Text>
                    </View>
                  )}
                  {wash.status === 'completed' && (
                    <TouchableOpacity style={[styles.rateButton, { borderTopColor: theme.colors.border }]}>
                      <IconSymbol
                        ios_icon_name="star.fill"
                        android_material_icon_name="star"
                        size={16}
                        color={theme.colors.warning}
                      />
                      <Text style={[styles.rateButtonText, { color: theme.colors.accent }]}>Noter ce service</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </React.Fragment>
          ) : (
            <View 
              style={styles.emptyState}
              {...(Platform.OS === 'web' ? { 'data-dashboard-empty-state': true } : {})}
            >
              <IconSymbol
                ios_icon_name="clock"
                android_material_icon_name="schedule"
                size={48}
                color={theme.colors.textMuted}
              />
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>Aucun lavage en attente</Text>
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
    marginBottom: 4,
  },
  companyName: {
    fontSize: 28,
    fontWeight: '700',
  },
  createButton: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  washHeader: {
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
  washDate: {
    fontSize: 14,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  washInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  washAddress: {
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
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  webCard: {
    // Styles supplémentaires pour web uniquement
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
    } : {}),
  },
});
