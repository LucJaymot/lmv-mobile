
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
import { commonStyles } from '@/styles/commonStyles';
import { useTheme } from '@/theme/hooks';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { vehicleService } from '@/services/databaseService';
import { IconSymbol } from '@/components/IconSymbol';

export default function AddVehicleScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const { theme } = useTheme();
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [useOldFormat, setUseOldFormat] = useState(false); // Format ancien: XXXX-XX-XX
  
  // États pour les erreurs de validation
  const [licensePlateError, setLicensePlateError] = useState('');
  const [brandError, setBrandError] = useState('');
  const [modelError, setModelError] = useState('');
  const [typeError, setTypeError] = useState('');

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

  const handleLicensePlateChange = (text: string) => {
    const formatted = formatLicensePlate(text);
    setLicensePlate(formatted);
    // Nettoyer l'erreur quand l'utilisateur commence à taper
    if (licensePlateError) {
      setLicensePlateError('');
    }
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
    setLicensePlateError('');
  };
  
  const validateForm = (): boolean => {
    let isValid = true;
    const cleanedPlate = licensePlate.replace(/-/g, '');
    
    // Validation de la plaque d'immatriculation
    const expectedLength = useOldFormat ? 8 : 7;
    const formatText = useOldFormat ? 'XXXX-XX-XX' : 'XX-XXX-XX';
    if (!cleanedPlate || cleanedPlate.length !== expectedLength) {
      setLicensePlateError(`La plaque d'immatriculation doit contenir ${expectedLength} caractères (format: ${formatText})`);
      isValid = false;
    } else {
      setLicensePlateError('');
    }
    
    // Validation de la marque
    if (!brand || brand.trim() === '') {
      setBrandError('La marque est obligatoire');
      isValid = false;
    } else {
      setBrandError('');
    }
    
    // Validation du modèle
    if (!model || model.trim() === '') {
      setModelError('Le modèle est obligatoire');
      isValid = false;
    } else {
      setModelError('');
    }
    
    // Validation du type
    if (!type || type.trim() === '') {
      setTypeError('Le type est obligatoire');
      isValid = false;
    } else {
      setTypeError('');
    }
    
    return isValid;
  };

  const searchVehicleInfo = async () => {
    // Nettoyer la plaque d'immatriculation (enlever les tirets)
    const cleanedPlate = licensePlate.replace(/-/g, '');
    
    const expectedLength = useOldFormat ? 8 : 7;
    const formatText = useOldFormat ? 'XXXX-XX-XX' : 'XX-XXX-XX';
    if (!cleanedPlate || cleanedPlate.length !== expectedLength) {
      Alert.alert('Erreur', `Veuillez saisir une plaque d'immatriculation valide (format: ${formatText})`);
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

  const fetchBrandLogo = async (brandName: string): Promise<string | undefined> => {
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
      // Format: https://cdn.brandfetch.io/{identifier}/w/{width}/h/{height}/type/{type}?c={CLIENT_ID}
      // On utilise le format domaine avec fallback transparent pour garantir qu'une image est toujours retournée
      // Si le logo n'existe pas, Brandfetch retournera le fallback défini (transparent par défaut pour type=icon)
      const brandfetchUrl = `https://cdn.brandfetch.io/${normalizedBrand}.com/w/400/h/400/type/icon/fallback/transparent?c=${brandfetchClientId}`;
      
      console.log('🖼️ Récupération du logo Brandfetch pour:', brandName);
      console.log('🌐 URL:', brandfetchUrl.replace(brandfetchClientId, '[CLIENT_ID_MASQUÉ]'));
      
      // Retourner l'URL directement - React Native Image gérera les erreurs avec onError
      // Brandfetch retournera une image (logo ou fallback transparent si non trouvé)
      console.log('✅ URL du logo Brandfetch générée');
      return brandfetchUrl;
    } catch (error: any) {
      console.warn('⚠️ Erreur lors de la génération de l\'URL Brandfetch:', error.message);
      return undefined;
    }
  };

  const handleSave = async () => {
    // Valider le formulaire avant la soumission
    if (!validateForm()) {
      // Scroll vers le premier champ avec erreur
      return;
    }

    if (!clientCompany) {
      Alert.alert('Erreur', 'Vous devez être connecté en tant qu\'entreprise cliente');
      return;
    }

    setIsLoading(true);
    try {
      // Récupérer le logo de la marque via Brandfetch API
      const brandLogoUrl = await fetchBrandLogo(brand);
      
      // Sauvegarder la plaque avec les tirets
      // Utiliser le logo Brandfetch si disponible
      const finalImageUrl = brandLogoUrl;
      
      const vehicle = await vehicleService.create({
        clientCompanyId: clientCompany.id,
        licensePlate: licensePlate, // Sauvegarder avec les tirets
        brand,
        model,
        type,
        year: year ? parseInt(year) : undefined,
        imageUrl: finalImageUrl,
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
                borderColor: licensePlateError ? theme.colors.error : theme.colors.border,
                color: theme.colors.text,
              },
              licensePlateError && styles.inputError
            ]}
            placeholder={useOldFormat ? "XXXX-XX-XX" : "XX-XXX-XX"}
            placeholderTextColor={theme.colors.textMuted}
            value={licensePlate}
            onChangeText={handleLicensePlateChange}
            autoCapitalize="characters"
            maxLength={useOldFormat ? 10 : 9}
          />
          {licensePlateError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{licensePlateError}</Text>
          ) : null}
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
          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: brandError ? theme.colors.error : theme.colors.border,
                color: theme.colors.text,
              },
              brandError && styles.inputError
            ]}
            placeholder="Renault"
            placeholderTextColor={theme.colors.textMuted}
            value={brand}
            onChangeText={(text) => {
              setBrand(text);
              if (brandError) setBrandError('');
            }}
          />
          {brandError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{brandError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[commonStyles.inputLabel, { color: theme.colors.text }]}>Modèle *</Text>
          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: modelError ? theme.colors.error : theme.colors.border,
                color: theme.colors.text,
              },
              modelError && styles.inputError
            ]}
            placeholder="Clio"
            placeholderTextColor={theme.colors.textMuted}
            value={model}
            onChangeText={(text) => {
              setModel(text);
              if (modelError) setModelError('');
            }}
          />
          {modelError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{modelError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[commonStyles.inputLabel, { color: theme.colors.text }]}>Type *</Text>
          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: typeError ? theme.colors.error : theme.colors.border,
                color: theme.colors.text,
              },
              typeError && styles.inputError
            ]}
            placeholder="Berline"
            placeholderTextColor={theme.colors.textMuted}
            value={type}
            onChangeText={(text) => {
              setType(text);
              if (typeError) setTypeError('');
            }}
          />
          {typeError ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{typeError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[commonStyles.inputLabel, { color: theme.colors.text }]}>Année</Text>
          <TextInput
            style={[
              commonStyles.input,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }
            ]}
            placeholder="2024"
            placeholderTextColor={theme.colors.textMuted}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
          </>
        )}

        <Button
          variant="primary"
          size="lg"
          onPress={handleSave}
          disabled={isLoading}
          loading={isLoading}
          style={styles.saveButton}
        >
          Ajouter le véhicule
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
  searchButton: {
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
  inputError: {
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
  buttonDisabled: {
    opacity: 0.5,
  },
});
