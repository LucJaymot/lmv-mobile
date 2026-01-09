
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { UserRole } from '@/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [step, setStep] = useState<'role' | 'credentials' | 'profile'>('role');
  const [role, setRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [clientData, setClientData] = useState({
    name: '',
    address: '',
    contact: '',
    phone: '',
  });

  const [providerData, setProviderData] = useState({
    name: '',
    baseCity: '',
    radiusKm: '20',
    phone: '',
    description: '',
    services: [] as string[],
  });

  const [isLoading, setIsLoading] = useState(false);

  // Note: On ne redirige plus automatiquement vers le dashboard après inscription
  // L'utilisateur sera redirigé vers la page de connexion pour se connecter

  const handleRoleSelection = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('credentials');
  };

  const handleCredentialsNext = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setStep('profile');
  };

  const handleRegister = async () => {
    console.log('🔵 handleRegister appelé');
    console.log('Role:', role);
    console.log('Email:', email);
    console.log('Password:', password ? 'présent' : 'absent');
    console.log('Client data:', clientData);
    console.log('Provider data:', providerData);
    
    const profileData = role === 'client' ? { ...clientData, email } : { ...providerData, email, radiusKm: parseInt(providerData.radiusKm) };
    console.log('Profile data préparé:', profileData);

    if (role === 'client') {
      console.log('Validation client...');
      if (!clientData.name || !clientData.address || !clientData.contact || !clientData.phone) {
        console.log('❌ Validation client échouée');
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }
      console.log('✅ Validation client réussie');
    } else {
      console.log('Validation provider...');
      if (!providerData.name || !providerData.baseCity || !providerData.phone || providerData.services.length === 0) {
        console.log('❌ Validation provider échouée');
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires et sélectionner au moins un service');
        return;
      }
      console.log('✅ Validation provider réussie');
    }

    console.log('Démarrage de l\'inscription...');
    setIsLoading(true);
    try {
      console.log('Appel de register()...');
      await register(email, password, role, profileData);
      console.log('✅ Registration successful, redirecting to login...');
      
      // Redirection immédiate vers la page de connexion
      console.log('Redirection immédiate vers /auth/login...');
      router.replace('/auth/login');
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Full error:', error);
      
      // Afficher l'erreur dans une alerte
      const errorMessage = error?.message || 'Une erreur est survenue lors de l\'inscription';
      console.log('Affichage de l\'alerte d\'erreur:', errorMessage);
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
      console.log('handleRegister terminé');
    }
  };

  const toggleService = (service: string) => {
    setProviderData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  if (step === 'role') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <IconSymbol
              ios_icon_name="car.fill"
              android_material_icon_name="directions-car"
              size={64}
              color={colors.primary}
            />
            <Text style={styles.title}>Inscription</Text>
            <Text style={styles.subtitle}>Choisissez votre profil</Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelection('client')}
            >
              <IconSymbol
                ios_icon_name="building.2.fill"
                android_material_icon_name="business"
                size={48}
                color={colors.primary}
              />
              <Text style={styles.roleTitle}>Client</Text>
              <Text style={styles.roleDescription}>
                Je gère une flotte de véhicules et je recherche des prestataires de lavage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelection('provider')}
            >
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="local-car-wash"
                size={48}
                color={colors.accent}
              />
              <Text style={styles.roleTitle}>Prestataire</Text>
              <Text style={styles.roleDescription}>
                Je propose des services de lavage automobile sur site
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (step === 'credentials') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('role')}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Vos identifiants</Text>
            <Text style={styles.subtitle}>
              {role === 'client' ? 'Compte Client' : 'Compte Prestataire'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Email</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="votre@email.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Mot de passe</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Minimum 6 caractères"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Confirmer le mot de passe</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Retapez votre mot de passe"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.nextButton]}
              onPress={handleCredentialsNext}
            >
              <Text style={commonStyles.buttonText}>Suivant</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('credentials')}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Votre profil</Text>
          <Text style={styles.subtitle}>
            {role === 'client' ? 'Informations entreprise' : 'Informations prestataire'}
          </Text>
        </View>

        <View style={styles.form}>
          {role === 'client' ? (
            <React.Fragment>
              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Nom de l&apos;entreprise *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Ex: Garage Dupont"
                  placeholderTextColor={colors.textSecondary}
                  value={clientData.name}
                  onChangeText={(text) => setClientData({ ...clientData, name: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Adresse *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  placeholderTextColor={colors.textSecondary}
                  value={clientData.address}
                  onChangeText={(text) => setClientData({ ...clientData, address: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Nom du contact *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Jean Dupont"
                  placeholderTextColor={colors.textSecondary}
                  value={clientData.contact}
                  onChangeText={(text) => setClientData({ ...clientData, contact: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Téléphone *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="+33 1 23 45 67 89"
                  placeholderTextColor={colors.textSecondary}
                  value={clientData.phone}
                  onChangeText={(text) => setClientData({ ...clientData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Nom du service *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Ex: Lavage Pro Paris"
                  placeholderTextColor={colors.textSecondary}
                  value={providerData.name}
                  onChangeText={(text) => setProviderData({ ...providerData, name: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Ville de base *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Paris"
                  placeholderTextColor={colors.textSecondary}
                  value={providerData.baseCity}
                  onChangeText={(text) => setProviderData({ ...providerData, baseCity: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Rayon d&apos;intervention (km) *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="20"
                  placeholderTextColor={colors.textSecondary}
                  value={providerData.radiusKm}
                  onChangeText={(text) => setProviderData({ ...providerData, radiusKm: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Téléphone *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="+33 1 23 45 67 89"
                  placeholderTextColor={colors.textSecondary}
                  value={providerData.phone}
                  onChangeText={(text) => setProviderData({ ...providerData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Description</Text>
                <TextInput
                  style={[commonStyles.input, styles.textArea]}
                  placeholder="Décrivez vos services..."
                  placeholderTextColor={colors.textSecondary}
                  value={providerData.description}
                  onChangeText={(text) => setProviderData({ ...providerData, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Services proposés *</Text>
                <View style={styles.servicesContainer}>
                  <TouchableOpacity
                    style={[
                      styles.serviceChip,
                      providerData.services.includes('exterior') && styles.serviceChipActive,
                    ]}
                    onPress={() => toggleService('exterior')}
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        providerData.services.includes('exterior') && styles.serviceChipTextActive,
                      ]}
                    >
                      Extérieur
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.serviceChip,
                      providerData.services.includes('interior') && styles.serviceChipActive,
                    ]}
                    onPress={() => toggleService('interior')}
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        providerData.services.includes('interior') && styles.serviceChipTextActive,
                      ]}
                    >
                      Intérieur
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.serviceChip,
                      providerData.services.includes('complete') && styles.serviceChipActive,
                    ]}
                    onPress={() => toggleService('complete')}
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        providerData.services.includes('complete') && styles.serviceChipTextActive,
                      ]}
                    >
                      Complet
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </React.Fragment>
          )}

          <TouchableOpacity
            style={[buttonStyles.primary, styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={() => {
              console.log('🟢 Bouton "S\'inscrire" cliqué !');
              console.log('isLoading:', isLoading);
              console.log('step:', step);
              console.log('role:', role);
              if (isLoading) {
                console.log('⚠️ Le bouton est désactivé car isLoading est true');
                return;
              }
              handleRegister();
            }}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={commonStyles.buttonText}>
              {isLoading ? 'Inscription en cours...' : "S'inscrire"}
            </Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  serviceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  serviceChipTextActive: {
    color: '#FFFFFF',
  },
  nextButton: {
    marginTop: 8,
  },
  registerButton: {
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
