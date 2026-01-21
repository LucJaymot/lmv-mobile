
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { commonStyles } from '@/styles/commonStyles';
import { Button } from '@/components/ui/Button';
import { vehicleService } from '@/services/databaseService';
import { Vehicle, WashRequest } from '@/types';
import { useTheme } from '@/theme/hooks';
import { IconSymbol } from '@/components/IconSymbol';
import { useWebAnimations } from '@/hooks/useWebAnimations';

export default function EditVehicleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const [washRequests, setWashRequests] = useState<WashRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const { getDataAttribute } = useWebAnimations('vehicle-edit');
  const [useOldFormat, setUseOldFormat] = useState(false); // Format ancien: XXXX-XX-XX

  const formatLicensePlate = (text: string): string => {
    // Supprimer tous les caractères non alphanumériques et les tirets
    const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    if (useOldFormat) {
      // Format ancien: XXXX-XX-XX (8 caractères)
      const limited = cleaned.slice(0, 8);
      let formatted = '';
      for (let i = 0; i < limited.length; i++) {
        formatted += limited[i];
        // Ajouter un tiret après le 4ème caractère (indice 3) et après le 6ème caractère (indice 5)
        if (i === 3 || i === 5) {
          formatted += '-';
        }
      }
      return formatted;
    } else {
      // Format nouveau: XX-XXX-XX (7 caractères)
      const limited = cleaned.slice(0, 7);
      let formatted = '';
      for (let i = 0; i < limited.length; i++) {
        formatted += limited[i];
        // Ajouter un tiret après le 2ème caractère (indice 1) et après le 5ème caractère (indice 4)
        if (i === 1 || i === 4) {
          formatted += '-';
        }
      }
      return formatted;
    }
  };

  // Charger le véhicule depuis la base de données
  useEffect(() => {
    const loadVehicle = async () => {
      if (!id || typeof id !== 'string') {
        Alert.alert('Erreur', 'ID du véhicule manquant');
        router.back();
        return;
      }

      try {
        console.log('Chargement du véhicule:', id);
        const vehicle = await vehicleService.getById(id);
        
        if (!vehicle) {
          Alert.alert('Erreur', 'Véhicule introuvable');
          router.back();
          return;
        }

        console.log('Véhicule chargé:', vehicle);
        // Détecter automatiquement le format de la plaque (8 caractères = ancien format, 7 = nouveau)
        const cleanedPlate = (vehicle.licensePlate || '').replace(/-/g, '');
        const detectedOldFormat = cleanedPlate.length === 8;
        setUseOldFormat(detectedOldFormat);
        // Formater la plaque d'immatriculation avec le format détecté
        // On utilise une fonction locale pour formater avec le bon format
        const formatWithDetectedFormat = (text: string, isOld: boolean): string => {
          const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
          if (isOld) {
            const limited = cleaned.slice(0, 8);
            let formatted = '';
            for (let i = 0; i < limited.length; i++) {
              formatted += limited[i];
              if (i === 3 || i === 5) {
                formatted += '-';
              }
            }
            return formatted;
          } else {
            const limited = cleaned.slice(0, 7);
            let formatted = '';
            for (let i = 0; i < limited.length; i++) {
              formatted += limited[i];
              if (i === 1 || i === 4) {
                formatted += '-';
              }
            }
            return formatted;
          }
        };
        const formattedPlate = formatWithDetectedFormat(cleanedPlate, detectedOldFormat);
        setLicensePlate(formattedPlate);
        setBrand(vehicle.brand);
        setModel(vehicle.model);
        setType(vehicle.type);
        setImageUrl(vehicle.imageUrl);
        // Afficher les champs manuels car on est en mode édition
        setShowManualEntry(true);

        // Charger les prestations associées
        setIsLoadingRequests(true);
        try {
          const requests = await vehicleService.getWashRequestsByVehicleId(id);
          setWashRequests(requests);
        } catch (error: any) {
          console.error('Erreur lors du chargement des prestations:', error);
        } finally {
          setIsLoadingRequests(false);
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement du véhicule:', error);
        Alert.alert('Erreur', error.message || 'Impossible de charger le véhicule');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicle();
  }, [id, router]);

  const handleLicensePlateChange = (text: string) => {
    const formatted = formatLicensePlate(text);
    setLicensePlate(formatted);
  };

  const toggleFormat = () => {
    const newFormat = !useOldFormat;
    // Réinitialiser la plaque et reformater avec le nouveau format
    if (licensePlate) {
      const cleaned = licensePlate.replace(/-/g, '');
      // Formater avec le nouveau format (pas encore mis à jour dans le state)
      const formatWithFormat = (text: string, isOld: boolean): string => {
        const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (isOld) {
          const limited = cleaned.slice(0, 8);
          let formatted = '';
          for (let i = 0; i < limited.length; i++) {
            formatted += limited[i];
            if (i === 3 || i === 5) {
              formatted += '-';
            }
          }
          return formatted;
        } else {
          const limited = cleaned.slice(0, 7);
          let formatted = '';
          for (let i = 0; i < limited.length; i++) {
            formatted += limited[i];
            if (i === 1 || i === 4) {
              formatted += '-';
            }
          }
          return formatted;
        }
      };
      const formatted = formatWithFormat(cleaned, newFormat);
      setLicensePlate(formatted);
    }
    setUseOldFormat(newFormat);
  };

  const fetchBrandLogo = async (brandName: string): Promise<string | undefined> => {
    if (!brandName || brandName.trim() === '') {
      return undefined;
    }

    try {
      // Récupérer le CLIENT_ID Brandfetch depuis les variables d'environnement
      const brandfetchClientId = Constants.expoConfig?.extra?.brandfetchClientId || 
                                process.env.EXPO_PUBLIC_BRANDFETCH_CLIENT_ID;
      
      if (!brandfetchClientId) {
        console.warn('⚠️ BRANDFETCH_CLIENT_ID non configurée');
        return undefined;
      }

      // Normaliser le nom de la marque (minuscules, sans espaces)
      const normalizedBrand = brandName.toLowerCase().replace(/\s+/g, '');
      
      // Construire l'URL Brandfetch selon la documentation
      const brandfetchUrl = `https://cdn.brandfetch.io/${normalizedBrand}.com/w/400/h/400/type/icon/fallback/transparent?c=${brandfetchClientId}`;
      
      console.log('🖼️ Récupération du logo Brandfetch pour:', brandName);
      console.log('🌐 URL:', brandfetchUrl.replace(brandfetchClientId, '[CLIENT_ID_MASQUÉ]'));
      
      // Retourner l'URL directement - React Native Image gérera les erreurs avec onError
      console.log('✅ URL du logo Brandfetch générée');
      return brandfetchUrl;
    } catch (error: any) {
      console.warn('⚠️ Erreur lors de la génération de l\'URL Brandfetch:', error.message);
      return undefined;
    }
  };

  const handleBrandChange = async (text: string) => {
    setBrand(text);
    
    // Récupérer l'image de la marque si elle a changé
    if (text && text.trim() !== '') {
      setIsFetchingImage(true);
      try {
        const brandLogoUrl = await fetchBrandLogo(text);
        if (brandLogoUrl) {
          setImageUrl(brandLogoUrl);
          console.log('✅ Logo de la marque mis à jour');
        }
      } catch (error: any) {
        console.warn('⚠️ Erreur lors de la récupération du logo:', error);
      } finally {
        setIsFetchingImage(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'accepted':
        return theme.colors.accent;
      case 'in_progress':
        return theme.colors.accent;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
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

  const handleSave = async () => {
    // Nettoyer la plaque d'immatriculation (enlever les tirets pour la validation)
    const cleanedPlate = licensePlate.replace(/-/g, '');
    
    const expectedLength = useOldFormat ? 8 : 7;
    const formatText = useOldFormat ? 'XXXX-XX-XX' : 'XX-XXX-XX';
    if (!cleanedPlate || cleanedPlate.length !== expectedLength || !brand || !model || !type) {
      Alert.alert('Erreur', `Veuillez remplir tous les champs. La plaque doit contenir ${expectedLength} caractères (format: ${formatText})`);
      return;
    }

    if (!id || typeof id !== 'string') {
      Alert.alert('Erreur', 'ID du véhicule manquant');
      return;
    }

    setIsSaving(true);
    try {
      // Récupérer le logo de la marque via Brandfetch API si l'image n'a pas été mise à jour
      let finalImageUrl = imageUrl;
      if (brand && brand.trim() !== '' && !imageUrl) {
        finalImageUrl = await fetchBrandLogo(brand);
      }
      
      // Sauvegarder la plaque avec les tirets
      console.log('Mise à jour du véhicule:', id, { licensePlate, brand, model, type, imageUrl: finalImageUrl });
      await vehicleService.update(id, {
        licensePlate: licensePlate, // Sauvegarder avec les tirets
        brand,
        model,
        type,
        imageUrl: finalImageUrl,
      });
      console.log('✅ Véhicule mis à jour avec succès');
      Alert.alert('Succès', 'Véhicule modifié avec succès');
      // Redirection immédiate vers la liste des véhicules
      router.replace('/vehicles');
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour du véhicule:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la modification du véhicule');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement du véhicule...</Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={[commonStyles.inputLabel, { color: theme.colors.text }]}>Plaque d&apos;immatriculation *</Text>
            <TouchableOpacity
              onPress={toggleFormat}
              style={[styles.formatToggleButton, { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border }]}
            >
              <IconSymbol
                android_material_icon_name="schedule"
                size={16}
                color={theme.colors.textMuted}
              />
              <Text style={[styles.formatToggleText, { color: theme.colors.textMuted }]}>
                {useOldFormat ? 'Nouveau format' : 'Ancien format'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder={useOldFormat ? "XXXX-XX-XX" : "XX-XXX-XX"}
            placeholderTextColor={theme.colors.textMuted}
            value={licensePlate}
            onChangeText={handleLicensePlateChange}
            autoCapitalize="characters"
            editable={!isSaving}
            maxLength={useOldFormat ? 10 : 9}
          />
        </View>

        {!showManualEntry && (
          <TouchableOpacity
            style={[styles.manualEntryButton, { backgroundColor: theme.colors.accent }]}
            onPress={() => setShowManualEntry(true)}
          >
            <Text style={styles.manualEntryButtonText}>Saisie manuelle</Text>
          </TouchableOpacity>
        )}

        {showManualEntry && (
          <>
        <View style={styles.inputContainer}>
          <Text style={[commonStyles.inputLabel, { color: theme.colors.text }]}>Marque *</Text>
          <View style={styles.inputWithLoader}>
          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="Renault"
            placeholderTextColor={theme.colors.textMuted}
            value={brand}
              onChangeText={handleBrandChange}
            editable={!isSaving}
          />
            {isFetchingImage && (
              <ActivityIndicator
                size="small"
                color={theme.colors.accent}
                style={styles.loaderIcon}
              />
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[commonStyles.inputLabel, { color: theme.colors.text }]}>Modèle *</Text>
          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="Clio"
            placeholderTextColor={theme.colors.textMuted}
            value={model}
            onChangeText={setModel}
            editable={!isSaving}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[commonStyles.inputLabel, { color: theme.colors.text }]}>Type *</Text>
          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder="Berline"
            placeholderTextColor={theme.colors.textMuted}
            value={type}
            onChangeText={setType}
            editable={!isSaving}
          />
        </View>
          </>
        )}

        {washRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Prestations associées ({washRequests.length})
            </Text>
            {isLoadingRequests ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                  Chargement des prestations...
                </Text>
              </View>
            ) : (
              <View style={styles.requestsContainer}>
                {washRequests.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    style={[commonStyles.card, styles.requestCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => router.push(`/(client)/requests/detail?id=${request.id}`)}
                  >
                    <View style={styles.requestHeader}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                        <Text style={styles.statusText}>{getStatusLabel(request.status)}</Text>
                      </View>
                      <Text style={[styles.requestDate, { color: theme.colors.textMuted }]}>
                        {formatDate(request.dateTime)}
                      </Text>
                    </View>
                    <View style={styles.requestInfo}>
                      <IconSymbol
                        ios_icon_name="location.fill"
                        android_material_icon_name="location-on"
                        size={16}
                        color={theme.colors.textMuted}
                      />
                      <Text style={[styles.requestAddress, { color: theme.colors.textMuted }]} numberOfLines={1}>
                        {request.address}
                      </Text>
                    </View>
                    {request.provider && (
                      <Text style={[styles.providerName, { color: theme.colors.text }]}>
                        {request.provider.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <Button
          variant="primary"
          size="lg"
          onPress={handleSave}
          disabled={isSaving}
          loading={isSaving}
          style={styles.saveButton}
        >
          Enregistrer les modifications
        </Button>
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
  },
  inputContainer: {
    marginBottom: 16,
  },
  manualEntryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  manualEntryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: 24,
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
  inputWithLoader: {
    position: 'relative',
  },
  loaderIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  requestsContainer: {
    gap: 12,
  },
  requestCard: {
    padding: 12,
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
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  requestAddress: {
    fontSize: 14,
    flex: 1,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formatToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  formatToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
