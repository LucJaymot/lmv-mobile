
import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { vehicleService } from '@/services/databaseService';

export default function AddVehicleScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

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

  const handleLicensePlateChange = (text: string) => {
    const formatted = formatLicensePlate(text);
    setLicensePlate(formatted);
  };

  const searchVehicleInfo = async () => {
    // Nettoyer la plaque d'immatriculation (enlever les tirets)
    const cleanedPlate = licensePlate.replace(/-/g, '');
    
    if (!cleanedPlate || cleanedPlate.length !== 8) {
      Alert.alert('Erreur', 'Veuillez saisir une plaque d\'immatriculation valide (format: XXXX-XX-XX)');
      return;
    }

    // Clé API forcée directement
    const apiKey = 'dgt1u9e9g_52f67iguv_kkw6yvdzh';

    setIsSearching(true);
    try {
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams({
        key: apiKey,
        plate: cleanedPlate,
        state: 'CA', // Par défaut, on utilise CA, vous pouvez adapter selon vos besoins
      });

      const response = await fetch(`https://api.carsxe.com/v2/platedecoder?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des informations du véhicule');
      }

      // Mapper les données de l'API vers les champs du formulaire
      if (data.make) {
        setBrand(data.make);
      }
      if (data.model) {
        setModel(data.model);
      }
      // Utiliser la description comme type si disponible, sinon utiliser un type par défaut
      if (data.description) {
        setType(data.description);
      } else {
        setType('Véhicule particulier');
      }
      // Récupérer l'année si disponible dans la réponse
      if (data.year) {
        setYear(data.year.toString());
      }

      // Afficher automatiquement les champs manuels pour montrer les résultats
      setShowManualEntry(true);

      Alert.alert('Succès', 'Informations du véhicule récupérées avec succès');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de récupérer les informations du véhicule. Veuillez remplir les champs manuellement.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    // Nettoyer la plaque d'immatriculation (enlever les tirets pour la validation)
    const cleanedPlate = licensePlate.replace(/-/g, '');
    
    if (!cleanedPlate || cleanedPlate.length !== 8 || !brand || !model || !type) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs. La plaque doit contenir 8 caractères (format: XXXX-XX-XX)');
      return;
    }

    if (!clientCompany) {
      Alert.alert('Erreur', 'Vous devez être connecté en tant qu\'entreprise cliente');
      return;
    }

    setIsLoading(true);
    try {
      // Récupérer l'image du véhicule depuis l'API CarsXE Images
      // TODO: À réactiver quand le problème CORS sera résolu (via proxy backend ou Edge Function)
      let imageUrl: string | undefined = undefined;
      
      // TEMPORAIREMENT DÉSACTIVÉ - Bloqué pour le moment
      const API_CARSXE_ENABLED = false;
      
      if (API_CARSXE_ENABLED) {
        try {
          // Clé API forcée directement
          const apiKey = 'dgt1u9e9g_52f67iguv_kkw6yvdzh';
          
          // Vérifier si on est sur web (CORS bloqué)
          const isWeb = Platform.OS === 'web' || typeof window !== 'undefined';
          
          // Sur web, on saute l'appel API à cause de CORS
          if (isWeb) {
            console.log('');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⚠️  APPEL API CarsXE Images - SKIPPÉ (Web)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('   L\'API CarsXE bloque les requêtes CORS depuis le navigateur.');
            console.log('   Le véhicule sera créé sans image.');
            console.log('   💡 Solution: Utiliser un proxy backend ou Edge Function.');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
          } else if (apiKey && brand && model && year) {
          // Préparer les paramètres exactement comme dans la spécification curl
          const params = new URLSearchParams({
            key: apiKey,
            make: brand.toLowerCase(),
            model: model.toLowerCase(),
            year: year,
            format: 'json',
          });

          const apiUrl = `https://api.carsxe.com/images?${params.toString()}`;
          
          // === DEBUG: Affichage de l'appel API CarsXE Images ===
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🖼️  APPEL API - CarsXE Images');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          console.log('📡 Équivalent curl:');
          console.log(`curl -G https://api.carsxe.com/images \\`);
          console.log(`  -d key=${apiKey ? '[API_KEY_MASQUÉE]' : 'CARSXE_API_KEY'} \\`);
          console.log(`  -d make=${brand.toLowerCase()} \\`);
          console.log(`  -d model=${model.toLowerCase()} \\`);
          console.log(`  -d year=${year} \\`);
          console.log(`  -d format=json`);
          console.log('');
          console.log('🌐 URL complète:', apiUrl.replace(apiKey, '[API_KEY_MASQUÉE]'));
          console.log('');
          console.log('📋 Paramètres envoyés:');
          console.log(JSON.stringify({
            key: '[MASQUÉ]',
            make: brand.toLowerCase(),
            model: model.toLowerCase(),
            year: year,
            format: 'json',
          }, null, 2));
          console.log('');
          console.log('⏳ Envoi de la requête...');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          
          const imageResponse = await fetch(apiUrl);
          const imageData = await imageResponse.json();

          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📦 RÉPONSE API - CarsXE Images');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📊 Statut HTTP:', imageResponse.status, imageResponse.statusText);
          console.log('📦 Corps de la réponse:');
          console.log(JSON.stringify(imageData, null, 2));
          console.log('');

          if (imageResponse.ok && imageData.success) {
            // L'API peut retourner l'image dans différents champs selon la réponse
            imageUrl = imageData.image || imageData.url || imageData.imageUrl || imageData.image_url;
            if (imageUrl) {
              console.log('✅ Image récupérée avec succès:');
              console.log('   URL:', imageUrl);
            } else {
              console.log('⚠️ Aucune URL d\'image trouvée dans la réponse');
            }
          } else {
            console.log('⚠️ Erreur API ou aucune image disponible:');
            console.log('   Message:', imageData.message || 'Réponse non réussie');
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          } else {
            console.log('');
            console.log('⚠️ APPEL API CarsXE Images - ANNULÉ');
            console.log('⚠️ Paramètres manquants:');
            console.log('   API Key:', apiKey ? '✅ Présente' : '❌ Manquante');
            console.log('   Brand:', brand ? '✅ Présente' : '❌ Manquante');
            console.log('   Model:', model ? '✅ Présente' : '❌ Manquante');
            console.log('   Year:', year ? '✅ Présente' : '❌ Manquante');
            console.log('');
          }
        } catch (imageError: any) {
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('❌ ERREUR - Appel API CarsXE Images');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.warn('⚠️ Erreur lors de la récupération de l\'image:', imageError);
          console.log('   Type:', imageError?.constructor?.name);
          console.log('   Message:', imageError?.message);
          
          // Détecter spécifiquement l'erreur CORS
          const isCorsError = imageError?.message?.includes('CORS') || 
                             imageError?.message?.includes('Failed to fetch') ||
                             imageError?.message?.includes('blocked by CORS');
          
          if (isCorsError) {
            console.log('   ⚠️ Erreur CORS détectée: L\'API CarsXE bloque les requêtes depuis le navigateur.');
            console.log('   💡 Solution: L\'appel API doit être effectué depuis un serveur (proxy/backend).');
            console.log('   ✅ Le véhicule sera créé sans image.');
          }
          
          console.log('   Stack:', imageError?.stack);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          // On continue quand même la création du véhicule même si l'image échoue
        }
      } else {
        // API désactivée - pas d'appel
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  APPEL API CarsXE Images - DÉSACTIVÉ');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   L\'appel API est temporairement désactivé.');
        console.log('   Le véhicule sera créé sans image.');
        console.log('   💡 Pour réactiver: mettre API_CARSXE_ENABLED à true');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
      }
      
      // Sauvegarder la plaque avec les tirets
      const vehicle = await vehicleService.create({
        clientCompanyId: clientCompany.id,
        licensePlate: licensePlate, // Sauvegarder avec les tirets
        brand,
        model,
        type,
        year: year ? parseInt(year) : undefined,
        imageUrl,
      });
      
      // Redirection immédiate vers la liste des véhicules
      router.replace('/(client)/(tabs)/vehicles');
    } catch (error: any) {
      
      const errorMessage = error?.message || error?.details || 'Une erreur est survenue lors de l\'ajout du véhicule';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
            maxLength={10}
          />
        </View>

        {false && (
          <TouchableOpacity
            style={[styles.searchButton, (isSearching || !licensePlate) && styles.buttonDisabled]}
            onPress={searchVehicleInfo}
            disabled={isSearching || !licensePlate}
          >
            {isSearching ? (
              <View style={styles.searchButtonContent}>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.searchSpinner} />
                <Text style={styles.searchButtonText}>Recherche en cours...</Text>
              </View>
            ) : (
              <Text style={styles.searchButtonText}>Rechercher les informations de la voiture</Text>
            )}
          </TouchableOpacity>
        )}

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
          <TextInput
            style={commonStyles.input}
            placeholder="Renault"
            placeholderTextColor={colors.textSecondary}
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Modèle *</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="Clio"
            placeholderTextColor={colors.textSecondary}
            value={model}
            onChangeText={setModel}
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
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={commonStyles.inputLabel}>Année</Text>
          <TextInput
            style={commonStyles.input}
            placeholder="2024"
            placeholderTextColor={colors.textSecondary}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
          </>
        )}

        <TouchableOpacity
          style={[buttonStyles.primary, styles.saveButton, isLoading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={commonStyles.buttonText}>
            {isLoading ? 'Ajout en cours...' : 'Ajouter le véhicule'}
          </Text>
        </TouchableOpacity>
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
  searchButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSpinner: {
    marginRight: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
