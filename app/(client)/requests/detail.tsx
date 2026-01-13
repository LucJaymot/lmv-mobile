
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { washRequestService, providerService } from '@/services/databaseService';
import { WashRequest } from '@/types'
import { useAuth } from '@/contexts/AuthContextSupabase';
import { pickInvoice, uploadInvoice } from '@/services/storageService';

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [washRequest, setWashRequest] = useState<WashRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
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

        // Charger les informations du prestataire si présent
        if (request.providerId) {
          try {
            const provider = await providerService.getById(request.providerId);
            request.provider = provider || undefined;
          } catch (error) {
            console.error('Erreur lors du chargement du prestataire:', error);
          }
        }

        console.log('Demande chargée:', request);
        setWashRequest(request);
        setNotes(request.notes || '');
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
      year: 'numeric',
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

  const openAddressInMaps = async (address: string) => {
    try {
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      
      if (Platform.OS === 'web') {
        // Web : ouvrir dans un nouvel onglet
        if (typeof window !== 'undefined' && window.open) {
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        } else {
          await Linking.openURL(webUrl);
        }
      } else if (Platform.OS === 'ios') {
        // iOS utilise Apple Maps
        const url = `maps://maps.apple.com/?q=${encodeURIComponent(address)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          // Fallback vers Google Maps web si Apple Maps n'est pas disponible
          await Linking.openURL(webUrl);
        }
      } else if (Platform.OS === 'android') {
        // Android : essayer Google Maps app d'abord, puis fallback vers web
        const googleMapsUrl = `google.navigation:q=${encodeURIComponent(address)}`;
        const canOpen = await Linking.canOpenURL(googleMapsUrl);
        if (canOpen) {
          await Linking.openURL(googleMapsUrl);
        } else {
          // Fallback vers Google Maps web
          await Linking.openURL(webUrl);
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ouverture de Maps:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'adresse dans Maps');
    }
  };

  const handleSaveNotes = async () => {
    if (!washRequest || !washRequest.id) {
      return;
    }

    setIsSavingNotes(true);
    try {
      console.log('Sauvegarde des notes:', notes);
      const updated = await washRequestService.update(washRequest.id, { notes: notes.trim() || undefined });
      setWashRequest(updated);
      console.log('✅ Notes sauvegardées avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde des notes:', error);
      Alert.alert('Erreur', error.message || 'Impossible de sauvegarder les notes');
      // Restaurer les notes précédentes en cas d'erreur
      setNotes(washRequest.notes || '');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!washRequest || !washRequest.id) {
      return;
    }

    try {
      console.log('Suppression de la demande:', washRequest.id);
      await washRequestService.delete(washRequest.id);
      console.log('✅ Demande supprimée avec succès');
      // Retourner en arrière directement après la suppression
      router.back();
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression de la demande:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'annuler la demande');
    }
  };

  const handleUploadInvoice = async () => {
    if (!washRequest || !washRequest.id || !user) {
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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement de la demande...</Text>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(washRequest.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(washRequest.status)}</Text>
        </View>

        <Text style={styles.title}>Demande de lavage</Text>
        <Text style={styles.subtitle}>Créée le {formatDate(washRequest.createdAt)}</Text>

        {washRequest.provider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prestataire</Text>
            <View style={commonStyles.card}>
              <Text style={styles.providerName}>{washRequest.provider.name}</Text>
              {washRequest.provider.phone && (
                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoText}>{washRequest.provider.phone}</Text>
                </View>
              )}
              {washRequest.provider.averageRating !== undefined && washRequest.provider.averageRating > 0 && (
                <View style={styles.ratingRow}>
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={16}
                    color={colors.highlight}
                  />
                  <Text style={styles.ratingText}>
                    {washRequest.provider.averageRating.toFixed(1)} 
                    {washRequest.provider.totalRatings ? ` (${washRequest.provider.totalRatings} avis)` : ''}
                  </Text>
                </View>
              )}
              {washRequest.provider.description && (
                <Text style={styles.description}>{washRequest.provider.description}</Text>
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
                color={colors.primary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Lieu</Text>
                <Text style={[styles.detailValue, styles.clickableAddress]}>{washRequest.address}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.detailRow}>
              <IconSymbol
                ios_icon_name="note.text"
                android_material_icon_name="note"
                size={20}
                color={colors.textSecondary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <TextInput
                  style={[styles.detailValue, styles.noteInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ajoutez des notes..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onBlur={handleSaveNotes}
                  editable={!isSavingNotes}
                />
                {isSavingNotes && (
                  <View style={styles.savingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.savingText}>Sauvegarde...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Véhicules</Text>
          {washRequest.vehicles && washRequest.vehicles.length > 0 ? (
            <View style={commonStyles.card}>
              {washRequest.vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleItem}>
                  <Text style={styles.vehiclePlate}>
                    {vehicle.vehicle?.licensePlate || 'Véhicule'}
                  </Text>
                  {vehicle.vehicle && (
                    <Text style={styles.vehicleName}>
                      {vehicle.vehicle.brand} {vehicle.vehicle.model}
                    </Text>
                  )}
                  <Text style={styles.serviceType}>
                    Service: {getServiceTypeLabel(vehicle.serviceType)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={commonStyles.card}>
              <Text style={styles.emptyText}>Aucun véhicule associé</Text>
            </View>
          )}
        </View>

        {washRequest.status === 'completed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facture</Text>
            <View style={commonStyles.card}>
              {washRequest.invoiceUrl ? (
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.invoiceButton]}
                  onPress={handleViewInvoice}
                >
                  <IconSymbol
                    ios_icon_name="doc.fill"
                    android_material_icon_name="description"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={[commonStyles.buttonText, styles.invoiceButtonText]}>
                    Voir la facture
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.invoiceButton, isUploadingInvoice && styles.buttonDisabled]}
                  onPress={handleUploadInvoice}
                  disabled={isUploadingInvoice}
                >
                  {isUploadingInvoice ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={[commonStyles.buttonText, styles.invoiceButtonText]}>
                        Upload en cours...
                      </Text>
                    </>
                  ) : (
                    <>
                      <IconSymbol
                        ios_icon_name="doc.badge.plus"
                        android_material_icon_name="upload-file"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={[commonStyles.buttonText, styles.invoiceButtonText]}>
                        Déposer une facture (PDF)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {washRequest.status !== 'cancelled' && washRequest.status !== 'completed' && (
          <TouchableOpacity
            style={[buttonStyles.outline, styles.cancelButton]}
            onPress={() => {
              // Utiliser window.confirm pour le web, Alert.alert pour mobile
              if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
                const confirmed = window.confirm('Êtes-vous sûr de vouloir annuler cette demande ?');
                if (confirmed) {
                  handleCancelRequest();
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
                      onPress: handleCancelRequest,
                    },
                  ]
                );
              }
            }}
          >
            <Text style={commonStyles.buttonTextOutline}>Annuler la demande</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  providerName: {
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
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
  noteInput: {
    minHeight: 80,
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  savingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  clickableAddress: {
    color: colors.primary,
    textDecorationLine: 'underline',
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
    color: colors.primary,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  invoiceButtonText: {
    marginLeft: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
