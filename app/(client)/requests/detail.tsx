
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
  ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/hooks';
import { washRequestService, providerService } from '@/services/databaseService';
import { WashRequest } from '@/types'
import { useAuth } from '@/contexts/AuthContextSupabase';
import { useWebAnimations } from '@/hooks/useWebAnimations';

export default function RequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [washRequest, setWashRequest] = useState<WashRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { getDataAttribute } = useWebAnimations('request-detail');

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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement de la demande...</Text>
        </View>
      </View>
    );
  }

  if (!washRequest) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Demande introuvable</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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

        <Text style={[styles.title, { color: theme.colors.text }]}>Demande de lavage</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Créée le {formatDate(washRequest.createdAt)}</Text>

        {washRequest.provider && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Prestataire</Text>
            <View style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.providerName, { color: theme.colors.text }]}>{washRequest.provider.name}</Text>
              {washRequest.provider.phone && (
                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={16}
                    color={theme.colors.textMuted}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.textMuted }]}>{washRequest.provider.phone}</Text>
                </View>
              )}
              {washRequest.provider.averageRating !== undefined && washRequest.provider.averageRating > 0 && (
                <View style={styles.ratingRow}>
                  <IconSymbol
                    ios_icon_name="star.fill"
                    android_material_icon_name="star"
                    size={16}
                    color={theme.colors.accent}
                  />
                  <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                    {washRequest.provider.averageRating.toFixed(1)} 
                    {washRequest.provider.totalRatings ? ` (${washRequest.provider.totalRatings} avis)` : ''}
                  </Text>
                </View>
              )}
              {washRequest.provider.description && (
                <Text style={[styles.description, { color: theme.colors.textMuted }]}>{washRequest.provider.description}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Détails</Text>
          <View style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="event"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Date et heure</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(washRequest.dateTime)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => openAddressInMaps(washRequest.address)}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Lieu</Text>
                <Text style={[styles.detailValue, styles.clickableAddress, { color: theme.colors.text }]}>{washRequest.address}</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.detailRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="note.text"
                android_material_icon_name="note"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>Notes</Text>
                <TextInput
                  style={[styles.detailValue, styles.noteInput, { 
                    backgroundColor: theme.colors.elevated,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ajoutez des notes..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onBlur={handleSaveNotes}
                  editable={!isSavingNotes}
                />
                {isSavingNotes && (
                  <View style={styles.savingIndicator}>
                    <ActivityIndicator size="small" color={theme.colors.accent} />
                    <Text style={[styles.savingText, { color: theme.colors.textMuted }]}>Sauvegarde...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Véhicules</Text>
          {washRequest.vehicles && washRequest.vehicles.length > 0 ? (
            <View style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
              {washRequest.vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleItem}>
                  <Text style={[styles.vehiclePlate, { color: theme.colors.text }]}>
                    {vehicle.vehicle?.licensePlate || 'Véhicule'}
                  </Text>
                  {vehicle.vehicle && (
                    <Text style={[styles.vehicleName, { color: theme.colors.textMuted }]}>
                      {vehicle.vehicle.brand} {vehicle.vehicle.model}
                    </Text>
                  )}
                  <Text style={[styles.serviceType, { color: theme.colors.text }]}>
                    Service: {getServiceTypeLabel(vehicle.serviceType)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>Aucun véhicule associé</Text>
            </View>
          )}
        </View>

        {washRequest.status === 'completed' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Facture</Text>
            <View style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
              {washRequest.invoiceUrl ? (
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleViewInvoice}
                  style={styles.invoiceButton}
                >
                  Voir la facture
                </Button>
              ) : (
                <View style={styles.noInvoiceContainer}>
                  <IconSymbol
                    ios_icon_name="doc.text"
                    android_material_icon_name="description"
                    size={24}
                    color={theme.colors.textMuted}
                  />
                  <Text style={[styles.noInvoiceText, { color: theme.colors.textMuted }]}>
                    Aucune facture déposée par le prestataire
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {washRequest.status !== 'cancelled' && washRequest.status !== 'completed' && (
          <Button
            variant="ghost"
            size="md"
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
            style={{ ...styles.cancelButton, borderColor: theme.colors.error }}
            textStyle={{ color: theme.colors.error }}
          >
            Annuler la demande
          </Button>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
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
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
  },
  noteInput: {
    minHeight: 80,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
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
    fontStyle: 'italic',
  },
  clickableAddress: {
    textDecorationLine: 'underline',
  },
  vehicleItem: {
    paddingVertical: 8,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  vehicleName: {
    fontSize: 14,
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 14,
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
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  invoiceButton: {
    width: '100%',
  },
  noInvoiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  noInvoiceText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
