
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useTheme } from '@/theme/hooks';
import { IconSymbol } from '@/components/IconSymbol';
import { Button } from '@/components/ui/Button';
import { washRequestService } from '@/services/databaseService';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { pickInvoice, uploadInvoice, deleteAllInvoicesForRequest } from '@/services/storageService';
import { WashRequest } from '@/types';

export default function ProviderRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { provider } = useAuth();
  const { theme } = useTheme();
  const [washRequest, setWashRequest] = useState<WashRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);

  useEffect(() => {
    const loadWashRequest = async () => {
      if (!id || typeof id !== 'string') {
        Alert.alert('Erreur', 'ID de la demande manquant');
        router.back();
        return;
      }

      try {
        console.log('Chargement de la demande:', id);
        const request = await washRequestService.getById(id);
        
        if (!request) {
          Alert.alert('Erreur', 'Demande introuvable');
          router.back();
          return;
        }

        console.log('Demande chargée:', request);
        setWashRequest(request);
      } catch (error: any) {
        console.error('Erreur lors du chargement de la demande:', error);
        Alert.alert('Erreur', error.message || 'Impossible de charger la demande');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadWashRequest();
  }, [id, router]);

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const openAddressInMaps = async (address: string) => {
    try {
      let url = '';
      if (Platform.OS === 'ios') {
        url = `maps://maps.apple.com/?q=${encodeURIComponent(address)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
          await Linking.openURL(webUrl);
        }
      } else if (Platform.OS === 'android') {
        const googleMapsUrl = `google.navigation:q=${encodeURIComponent(address)}`;
        const canOpen = await Linking.canOpenURL(googleMapsUrl);
        if (canOpen) {
          await Linking.openURL(googleMapsUrl);
        } else {
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
          await Linking.openURL(webUrl);
        }
      } else { // Web
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          await Linking.openURL(url);
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', `Impossible d'ouvrir l'adresse: ${error.message}`);
    }
  };

  const handleAccept = async () => {
    if (!provider || !washRequest) {
      Alert.alert('Erreur', 'Prestataire ou demande non trouvé');
      return;
    }

    // Confirmation
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir accepter cette demande ?');
      if (!confirmed) {
        return;
      }
    } else {
      Alert.alert(
        'Accepter la demande',
        'Êtes-vous sûr de vouloir accepter cette demande ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Accepter',
            onPress: async () => {
              await acceptRequest();
            },
          },
        ]
      );
      return;
    }

    await acceptRequest();
  };

  const acceptRequest = async () => {
    if (!provider || !washRequest) return;

    try {
      setIsAccepting(true);
      await washRequestService.update(washRequest.id, {
        providerId: provider.id,
        status: 'accepted',
      });
      Alert.alert('Succès', 'Demande acceptée avec succès', [
      { text: 'OK', onPress: () => router.back() },
    ]);
    } catch (error: any) {
      console.error('Erreur lors de l\'acceptation:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'accepter la demande');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!provider || !washRequest) {
      Alert.alert('Erreur', 'Prestataire ou demande non trouvé');
      return;
    }

    // Confirmation
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir refuser cette demande ? Cette demande ne vous sera plus visible.');
      if (!confirmed) {
        return;
      }
    } else {
      Alert.alert(
        'Refuser la demande',
        'Êtes-vous sûr de vouloir refuser cette demande ? Cette demande ne vous sera plus visible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Refuser',
            style: 'destructive',
            onPress: async () => {
              await declineRequest();
            },
          },
        ]
      );
      return;
    }

    await declineRequest();
  };

  const declineRequest = async () => {
    if (!washRequest || !provider) return;

    try {
      // Enregistrer le refus pour que cette demande ne soit plus visible par ce provider
      await washRequestService.recordProviderCancellation(provider.id, washRequest.id);
      console.log('✅ Demande refusée avec succès');
      
      // Rediriger vers la page précédente
      router.back();
    } catch (error: any) {
      console.error('❌ Erreur lors du refus de la demande:', error);
      Alert.alert('Erreur', error.message || 'Impossible de refuser la demande');
    }
  };

  const handleCancel = async () => {
    if (!washRequest) {
      Alert.alert('Erreur', 'Demande non trouvée');
      return;
    }

    // Confirmation
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir annuler cette demande ?');
      if (!confirmed) {
        return;
      }
    } else {
      Alert.alert(
        'Annuler la demande',
        'Êtes-vous sûr de vouloir annuler cette demande ?',
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui, annuler',
            style: 'destructive',
            onPress: async () => {
              await cancelRequest();
            },
          },
        ]
      );
      return;
    }

    await cancelRequest();
  };

  const cancelRequest = async () => {
    if (!washRequest || !provider) return;

    try {
      setIsCancelling(true);
      // Remettre la demande en pending et retirer le provider_id
      await washRequestService.update(washRequest.id, {
        status: 'pending',
        providerId: null as any, // Retirer le provider_id (remettre à null pour que la demande soit visible pour les autres providers)
      });
      // Enregistrer l'annulation pour ce provider
      await washRequestService.recordProviderCancellation(provider.id, washRequest.id);
      router.back();
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'annuler la demande');
      setIsCancelling(false);
    }
  };

  const handleUploadInvoice = async () => {
    if (!washRequest || !washRequest.id || !provider) {
      return;
    }

    setIsUploadingInvoice(true);
    try {
      // Sélectionner le fichier PDF
      const result = await pickInvoice();
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploadingInvoice(false);
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        setIsUploadingInvoice(false);
        return;
      }

      // Vérifier que c'est bien un PDF
      if (asset.mimeType !== 'application/pdf' && !asset.name?.endsWith('.pdf')) {
        Alert.alert('Erreur', 'Veuillez sélectionner un fichier PDF');
        setIsUploadingInvoice(false);
        return;
      }

      // Supprimer toutes les factures existantes pour cette demande avant d'uploader la nouvelle
      if (washRequest.invoiceUrl) {
        try {
          await deleteAllInvoicesForRequest(washRequest.id);
        } catch (error) {
          console.warn('⚠️ Erreur lors de la suppression des factures existantes (on continue quand même):', error);
          // On continue quand même l'upload même si la suppression échoue
        }
      }

      // Uploader le PDF
      const invoiceUrl = await uploadInvoice(asset.uri, washRequest.id);
      
      // Mettre à jour la demande avec l'URL de la facture
      const updated = await washRequestService.update(washRequest.id, { invoiceUrl });
      setWashRequest(updated);
      
      Alert.alert('Succès', 'Facture uploadée avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload de la facture:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'uploader la facture');
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  const handleViewInvoice = () => {
    if (!washRequest?.invoiceUrl) {
      return;
    }

    if (Platform.OS === 'web') {
      // Sur web, ouvrir dans un nouvel onglet
      if (typeof window !== 'undefined' && window.open) {
        window.open(washRequest.invoiceUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Sur mobile, ouvrir avec Linking
      Linking.openURL(washRequest.invoiceUrl);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!washRequest) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Demande introuvable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(washRequest.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(washRequest.status)}</Text>
        </View>

        <Text style={styles.title}>Demande de lavage</Text>
        <Text style={styles.subtitle}>Créée le {formatDate(washRequest.createdAt)}</Text>

        {washRequest.clientCompany && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={commonStyles.card}>
              <Text style={styles.clientName}>{washRequest.clientCompany.name}</Text>
              {washRequest.clientCompany.contact && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={16}
                color={colors.textSecondary}
              />
                  <Text style={styles.infoText}>{washRequest.clientCompany.contact}</Text>
            </View>
              )}
              {washRequest.clientCompany.phone && (
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={16}
                color={colors.textSecondary}
              />
                  <Text style={styles.infoText}>{washRequest.clientCompany.phone}</Text>
                </View>
              )}
              {washRequest.clientCompany.email && (
                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="envelope.fill"
                    android_material_icon_name="email"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoText}>{washRequest.clientCompany.email}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={commonStyles.card}>
            <View style={styles.detailRow}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={20}
                color={colors.textSecondary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date et heure</Text>
                <Text style={styles.detailValue}>{formatDate(washRequest.dateTime)}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.detailRow} 
              onPress={() => openAddressInMaps(washRequest.address)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={theme.colors.accent}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Lieu</Text>
                <Text style={[styles.detailValue, styles.clickableAddress, { color: theme.colors.accent }]}>{washRequest.address}</Text>
              </View>
            </TouchableOpacity>
            {washRequest.notes && (
              <View style={styles.detailRow}>
                <IconSymbol
                  ios_icon_name="note.text"
                  android_material_icon_name="note"
                  size={20}
                  color={colors.textSecondary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{washRequest.notes}</Text>
              </View>
            </View>
            )}
          </View>
        </View>

        {washRequest.vehicles && washRequest.vehicles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Véhicules</Text>
          <View style={commonStyles.card}>
              {washRequest.vehicles.map((vehicleRequest) => (
                <View key={vehicleRequest.id} style={styles.vehicleItem}>
                  {vehicleRequest.vehicle && (
                    <>
                      <Text style={styles.vehiclePlate}>{vehicleRequest.vehicle.licensePlate}</Text>
                      <Text style={styles.vehicleName}>
                        {vehicleRequest.vehicle.brand} {vehicleRequest.vehicle.model} - {vehicleRequest.vehicle.type}
                      </Text>
                    </>
                  )}
                  <Text style={[styles.serviceType, { color: theme.colors.accent }]}>
                    Service: {getServiceTypeLabel(vehicleRequest.serviceType)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {washRequest.status === 'pending' && (
        <View style={styles.actionButtons}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleDecline}
            style={{
              ...styles.declineButton,
              borderColor: theme.colors.error,
            }}
            textStyle={{ color: theme.colors.error }}
          >
            Refuser
          </Button>
          <Button
            variant="primary"
            size="md"
            onPress={handleAccept}
            disabled={isAccepting}
            loading={isAccepting}
            style={styles.acceptButton}
          >
            Accepter
          </Button>
        </View>
        )}

        {washRequest.status === 'accepted' && (
          <View style={styles.actionButtons}>
            <Button
              variant="ghost"
              size="md"
              onPress={handleCancel}
              disabled={isCancelling}
              loading={isCancelling}
              style={{
                ...styles.cancelButton,
                borderColor: theme.colors.error,
              }}
              textStyle={{ color: theme.colors.error }}
            >
              Annuler
            </Button>
          </View>
        )}

        {washRequest.status === 'completed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facture</Text>
            <View style={commonStyles.card}>
              {washRequest.invoiceUrl ? (
                <View style={styles.invoiceActions}>
                  <Button
                    variant="primary"
                    size="md"
                    onPress={handleViewInvoice}
                    style={styles.invoiceButton}
                  >
                    Voir la facture
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={handleUploadInvoice}
                    disabled={isUploadingInvoice}
                    loading={isUploadingInvoice}
                    style={styles.replaceInvoiceButton}
                  >
                    Remplacer
                  </Button>
                </View>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleUploadInvoice}
                  disabled={isUploadingInvoice}
                  loading={isUploadingInvoice}
                  style={styles.invoiceButton}
                >
                  Déposer une facture (PDF)
                </Button>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  vehicleItem: {
    paddingVertical: 8,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  vehicleName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  clickableAddress: {
    textDecorationLine: 'underline',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  invoiceButton: {
    flex: 1,
  },
  invoiceActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  replaceInvoiceButton: {
    minWidth: 100,
  },
});

