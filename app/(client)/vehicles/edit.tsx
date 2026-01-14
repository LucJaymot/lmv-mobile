
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
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { Button } from '@/components/ui/Button';
import { vehicleService } from '@/services/databaseService';
import { Vehicle } from '@/types';

export default function EditVehicleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  const formatLicensePlate = (text: string): string => {
    // Supprimer tous les caractères non alphanumériques et les tirets
    const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Limiter à 8 caractères
    const limited = cleaned.slice(0, 8);
    
    // Insérer les tirets automatiquement après la 4ème et 6ème position
    let formatted = '';
    for (let i = 0; i < limited.length; i++) {
      formatted += limited[i];
      // Ajouter un tiret après le 4ème caractère (indice 3) et après le 6ème caractère (indice 5)
      if (i === 3 || i === 5) {
        formatted += '-';
      }
    }
    
    return formatted;
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
        // Formater la plaque d'immatriculation au format XXXX-XX-XX
        const formattedPlate = formatLicensePlate(vehicle.licensePlate || '');
        setLicensePlate(formattedPlate);
        setBrand(vehicle.brand);
        setModel(vehicle.model);
        setType(vehicle.type);
        setImageUrl(vehicle.imageUrl);
        // Afficher les champs manuels car on est en mode édition
        setShowManualEntry(true);
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

  const handleSave = async () => {
    // Nettoyer la plaque d'immatriculation (enlever les tirets pour la validation)
    const cleanedPlate = licensePlate.replace(/-/g, '');
    
    if (!cleanedPlate || cleanedPlate.length !== 8 || !brand || !model || !type) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs. La plaque doit contenir 8 caractères (format: XXXX-XX-XX)');
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement du véhicule...</Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Plaque d&apos;immatriculation *</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="XXXX-XX-XX"
            placeholderTextColor={colors.textSecondary}
            value={licensePlate}
            onChangeText={handleLicensePlateChange}
            autoCapitalize="characters"
            editable={!isSaving}
            maxLength={10}
          />
        </View>

        {!showManualEntry && (
          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={() => setShowManualEntry(true)}
          >
            <Text style={styles.manualEntryButtonText}>Saisie manuelle</Text>
          </TouchableOpacity>
        )}

        {showManualEntry && (
          <>
        <View style={styles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Marque *</Text>
          <View style={styles.inputWithLoader}>
          <TextInput
            style={commonStyles.input}
            placeholder="Renault"
            placeholderTextColor={colors.textSecondary}
            value={brand}
              onChangeText={handleBrandChange}
            editable={!isSaving}
          />
            {isFetchingImage && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={styles.loaderIcon}
              />
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Modèle *</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Clio"
            placeholderTextColor={colors.textSecondary}
            value={model}
            onChangeText={setModel}
            editable={!isSaving}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Type *</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Berline"
            placeholderTextColor={colors.textSecondary}
            value={type}
            onChangeText={setType}
            editable={!isSaving}
          />
        </View>
          </>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  manualEntryButton: {
    backgroundColor: colors.primary,
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
    color: colors.textSecondary,
  },
  inputWithLoader: {
    position: 'relative',
  },
  loaderIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
});
