
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Logo } from '@/components/Logo';
import { UserRole } from '@/types';
import { useTheme } from '@/theme/hooks';
import { Button } from '@/components/ui/Button';

// Validation email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation mot de passe
const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Validation téléphone (format français : 10 chiffres, peut contenir des espaces, points, tirets)
const validatePhone = (phone: string): boolean => {
  // Supprimer les espaces, points, tirets et parenthèses
  const cleanPhone = phone.replace(/[\s\.\-\(\)]/g, '');
  // Vérifier que c'est uniquement des chiffres et qu'il y en a entre 9 et 15
  return /^[0-9]{9,15}$/.test(cleanPhone);
};

export default function RegisterScreen() {
  const router = useRouter();
  const { register, user } = useAuth();
  const { theme } = useTheme();
  const [step, setStep] = useState<'role' | 'credentials' | 'profile'>('role');
  const [role, setRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [clientData, setClientData] = useState({
    name: '',
    address: '',
    contact: '',
    phone: '',
  });
  const [clientNameError, setClientNameError] = useState<string | null>(null);
  const [clientAddressError, setClientAddressError] = useState<string | null>(null);
  const [clientContactError, setClientContactError] = useState<string | null>(null);
  const [clientPhoneError, setClientPhoneError] = useState<string | null>(null);
  const [clientNameFocused, setClientNameFocused] = useState(false);
  const [clientAddressFocused, setClientAddressFocused] = useState(false);
  const [clientContactFocused, setClientContactFocused] = useState(false);
  const [clientPhoneFocused, setClientPhoneFocused] = useState(false);

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

  const validateCredentialsForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    // Validation email
    if (!email.trim()) {
      setEmailError('L\'email est requis');
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Le format de l\'email n\'est pas valide');
      isValid = false;
    }

    // Validation mot de passe
    if (!password) {
      setPasswordError('Le mot de passe est requis');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      isValid = false;
    }

    // Validation confirmation mot de passe
    if (!confirmPassword) {
      setConfirmPasswordError('La confirmation du mot de passe est requise');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      isValid = false;
    }

    return isValid;
  };

  const handleCredentialsNext = () => {
    if (!validateCredentialsForm()) {
      return;
    }

    setStep('profile');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError(null);
    }
    // Réinitialiser aussi l'erreur de confirmation si elle existe
    if (confirmPasswordError && confirmPassword && text === confirmPassword) {
      setConfirmPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) {
      setConfirmPasswordError(null);
    }
  };

  const validateClientForm = (): boolean => {
    let isValid = true;
    setClientNameError(null);
    setClientAddressError(null);
    setClientContactError(null);
    setClientPhoneError(null);

    // Validation nom de l'entreprise
    if (!clientData.name.trim()) {
      setClientNameError('Le nom de l\'entreprise est requis');
      isValid = false;
    }

    // Validation adresse
    if (!clientData.address.trim()) {
      setClientAddressError('L\'adresse est requise');
      isValid = false;
    }

    // Validation nom du contact
    if (!clientData.contact.trim()) {
      setClientContactError('Le nom du contact est requis');
      isValid = false;
    }

    // Validation téléphone
    if (!clientData.phone.trim()) {
      setClientPhoneError('Le téléphone est requis');
      isValid = false;
    } else if (!validatePhone(clientData.phone.trim())) {
      setClientPhoneError('Le format du téléphone n\'est pas valide');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    console.log('🔵 handleRegister appelé');
    console.log('Role:', role);
    console.log('Email:', email);
    console.log('Password:', password ? 'présent' : 'absent');
    console.log('Client data:', clientData);
    console.log('Provider data:', providerData);
    
    // Validation des champs selon le rôle
    if (role === 'client') {
      if (!validateClientForm()) {
        return;
      }
    }
    
    const profileData = role === 'client' ? { ...clientData, email } : { ...providerData, email, radiusKm: parseInt(providerData.radiusKm) };
    console.log('Profile data préparé:', profileData);

    if (role === 'client') {
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/auth/login')}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <Logo size="lg" withCircleBackground />
            <Text style={[styles.title, { color: theme.colors.text }]}>Inscription</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Choisissez votre profil</Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleRoleSelection('client')}
            >
              <IconSymbol
                ios_icon_name="building.2.fill"
                android_material_icon_name="business"
                size={48}
                color={theme.colors.accent}
              />
              <Text style={[styles.roleTitle, { color: theme.colors.text }]}>Client</Text>
              <Text style={[styles.roleDescription, { color: theme.colors.textMuted }]}>
                Je gère une flotte de véhicules et je recherche des prestataires de lavage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleRoleSelection('provider')}
            >
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="local-car-wash"
                size={48}
                color={theme.colors.accent}
              />
              <Text style={[styles.roleTitle, { color: theme.colors.text }]}>Prestataire</Text>
              <Text style={[styles.roleDescription, { color: theme.colors.textMuted }]}>
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('role')}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Vos identifiants</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {role === 'client' ? 'Compte Client' : 'Compte Prestataire'}
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email</Text>
              <View style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: emailError ? theme.colors.error : (emailFocused ? theme.colors.accent : theme.colors.border),
                },
                emailFocused && { borderColor: theme.colors.accent },
                emailError && { borderColor: theme.colors.error },
              ]}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={20}
                  color={emailError ? theme.colors.error : (emailFocused ? theme.colors.accent : theme.colors.textMuted)}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="votre@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  returnKeyType="next"
                />
              </View>
              {emailError && (
                <View style={styles.errorContainer}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.circle.fill"
                    android_material_icon_name="error"
                    size={14}
                    color={theme.colors.error}
                    style={styles.errorIcon}
                  />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>{emailError}</Text>
                </View>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Mot de passe</Text>
              <View style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: passwordError ? theme.colors.error : (passwordFocused ? theme.colors.accent : theme.colors.border),
                },
                passwordFocused && { borderColor: theme.colors.accent },
                passwordError && { borderColor: theme.colors.error },
              ]}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={passwordError ? theme.colors.error : (passwordFocused ? theme.colors.accent : theme.colors.textMuted)}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Minimum 6 caractères"
                  placeholderTextColor={theme.colors.textMuted}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <IconSymbol
                    ios_icon_name={showPassword ? "eye.slash.fill" : "eye.fill"}
                    android_material_icon_name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {passwordError && (
                <View style={styles.errorContainer}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.circle.fill"
                    android_material_icon_name="error"
                    size={14}
                    color={theme.colors.error}
                    style={styles.errorIcon}
                  />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>{passwordError}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Confirmer le mot de passe</Text>
              <View style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: confirmPasswordError ? theme.colors.error : (confirmPasswordFocused ? theme.colors.accent : theme.colors.border),
                },
                confirmPasswordFocused && { borderColor: theme.colors.accent },
                confirmPasswordError && { borderColor: theme.colors.error },
              ]}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={confirmPasswordError ? theme.colors.error : (confirmPasswordFocused ? theme.colors.accent : theme.colors.textMuted)}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Retapez votre mot de passe"
                  placeholderTextColor={theme.colors.textMuted}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleCredentialsNext}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <IconSymbol
                    ios_icon_name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"}
                    android_material_icon_name={showConfirmPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError && (
                <View style={styles.errorContainer}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.circle.fill"
                    android_material_icon_name="error"
                    size={14}
                    color={theme.colors.error}
                    style={styles.errorIcon}
                  />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>{confirmPasswordError}</Text>
                </View>
              )}
            </View>

            <Button
              variant="primary"
              size="lg"
              onPress={handleCredentialsNext}
              style={styles.nextButton}
            >
              Suivant
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('credentials')}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Votre profil</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {role === 'client' ? 'Informations entreprise' : 'Informations prestataire'}
          </Text>
        </View>

        <View style={styles.form}>
          {role === 'client' ? (
            <React.Fragment>
              {/* Nom de l'entreprise */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Nom de l&apos;entreprise *</Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: clientNameError ? theme.colors.error : (clientNameFocused ? theme.colors.accent : theme.colors.border),
                  },
                  clientNameFocused && { borderColor: theme.colors.accent },
                  clientNameError && { borderColor: theme.colors.error },
                ]}>
                  <IconSymbol
                    ios_icon_name="building.2.fill"
                    android_material_icon_name="business"
                    size={20}
                    color={clientNameError ? theme.colors.error : (clientNameFocused ? theme.colors.accent : theme.colors.textMuted)}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Ex: Garage Dupont"
                    placeholderTextColor={theme.colors.textMuted}
                    value={clientData.name}
                    onChangeText={(text) => {
                      setClientData({ ...clientData, name: text });
                      if (clientNameError) setClientNameError(null);
                    }}
                    onFocus={() => setClientNameFocused(true)}
                    onBlur={() => setClientNameFocused(false)}
                    returnKeyType="next"
                  />
                </View>
                {clientNameError && (
                  <View style={styles.errorContainer}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.circle.fill"
                      android_material_icon_name="error"
                      size={14}
                      color={theme.colors.error}
                      style={styles.errorIcon}
                    />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{clientNameError}</Text>
                  </View>
                )}
              </View>

              {/* Adresse */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Adresse *</Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: clientAddressError ? theme.colors.error : (clientAddressFocused ? theme.colors.accent : theme.colors.border),
                  },
                  clientAddressFocused && { borderColor: theme.colors.accent },
                  clientAddressError && { borderColor: theme.colors.error },
                ]}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={clientAddressError ? theme.colors.error : (clientAddressFocused ? theme.colors.accent : theme.colors.textMuted)}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="123 Rue de la Paix, 75001 Paris"
                    placeholderTextColor={theme.colors.textMuted}
                    value={clientData.address}
                    onChangeText={(text) => {
                      setClientData({ ...clientData, address: text });
                      if (clientAddressError) setClientAddressError(null);
                    }}
                    onFocus={() => setClientAddressFocused(true)}
                    onBlur={() => setClientAddressFocused(false)}
                    returnKeyType="next"
                  />
                </View>
                {clientAddressError && (
                  <View style={styles.errorContainer}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.circle.fill"
                      android_material_icon_name="error"
                      size={14}
                      color={theme.colors.error}
                      style={styles.errorIcon}
                    />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{clientAddressError}</Text>
                  </View>
                )}
              </View>

              {/* Nom du contact */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Nom du contact *</Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: clientContactError ? theme.colors.error : (clientContactFocused ? theme.colors.accent : theme.colors.border),
                  },
                  clientContactFocused && { borderColor: theme.colors.accent },
                  clientContactError && { borderColor: theme.colors.error },
                ]}>
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={clientContactError ? theme.colors.error : (clientContactFocused ? theme.colors.accent : theme.colors.textMuted)}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Jean Dupont"
                    placeholderTextColor={theme.colors.textMuted}
                    value={clientData.contact}
                    onChangeText={(text) => {
                      setClientData({ ...clientData, contact: text });
                      if (clientContactError) setClientContactError(null);
                    }}
                    onFocus={() => setClientContactFocused(true)}
                    onBlur={() => setClientContactFocused(false)}
                    returnKeyType="next"
                  />
                </View>
                {clientContactError && (
                  <View style={styles.errorContainer}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.circle.fill"
                      android_material_icon_name="error"
                      size={14}
                      color={theme.colors.error}
                      style={styles.errorIcon}
                    />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{clientContactError}</Text>
                  </View>
                )}
              </View>

              {/* Téléphone */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Téléphone *</Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: clientPhoneError ? theme.colors.error : (clientPhoneFocused ? theme.colors.accent : theme.colors.border),
                  },
                  clientPhoneFocused && { borderColor: theme.colors.accent },
                  clientPhoneError && { borderColor: theme.colors.error },
                ]}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={20}
                    color={clientPhoneError ? theme.colors.error : (clientPhoneFocused ? theme.colors.accent : theme.colors.textMuted)}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="0123456789"
                    placeholderTextColor={theme.colors.textMuted}
                    value={clientData.phone}
                    onChangeText={(text) => {
                      setClientData({ ...clientData, phone: text });
                      if (clientPhoneError) setClientPhoneError(null);
                    }}
                    onFocus={() => setClientPhoneFocused(true)}
                    onBlur={() => setClientPhoneFocused(false)}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                  />
                </View>
                {clientPhoneError && (
                  <View style={styles.errorContainer}>
                    <IconSymbol
                      ios_icon_name="exclamationmark.circle.fill"
                      android_material_icon_name="error"
                      size={14}
                      color={theme.colors.error}
                      style={styles.errorIcon}
                    />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{clientPhoneError}</Text>
                  </View>
                )}
              </View>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Nom du service *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Ex: Lavage Pro Paris"
                  placeholderTextColor={theme.colors.textMuted}
                  value={providerData.name}
                  onChangeText={(text) => setProviderData({ ...providerData, name: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Ville de base *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Paris"
                  placeholderTextColor={theme.colors.textMuted}
                  value={providerData.baseCity}
                  onChangeText={(text) => setProviderData({ ...providerData, baseCity: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Rayon d&apos;intervention (km) *</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="20"
                  placeholderTextColor={theme.colors.textMuted}
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
                  placeholderTextColor={theme.colors.textMuted}
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
                  placeholderTextColor={theme.colors.textMuted}
                  value={providerData.description}
                  onChangeText={(text) => setProviderData({ ...providerData, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={commonStyles.inputLabel}>Services proposés *</Text>
                <View style={styles.servicesContainer}>
                  {(['exterior', 'interior', 'complete'] as string[]).map((service) => {
                    const isActive = providerData.services.includes(service);
                    return (
                      <TouchableOpacity
                        key={service}
                        style={[
                          styles.serviceChip,
                          {
                            borderColor: isActive ? theme.colors.accent : theme.colors.border,
                            backgroundColor: isActive ? theme.colors.accent : theme.colors.background,
                          },
                        ]}
                        onPress={() => toggleService(service)}
                      >
                        <Text
                          style={[
                            styles.serviceChipText,
                            {
                              color: isActive ? '#FFFFFF' : theme.colors.text,
                            },
                          ]}
                        >
                          {service === 'exterior' ? 'Extérieur' : service === 'interior' ? 'Intérieur' : 'Complet'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </React.Fragment>
          )}

          <Button
            variant="primary"
            size="lg"
            onPress={handleRegister}
            disabled={isLoading}
            loading={isLoading}
            style={styles.registerButton}
          >
            S&apos;inscrire
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
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
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  roleContainer: {
    gap: 16,
  },
  roleCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorIcon: {
    marginRight: 6,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
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
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nextButton: {
    marginTop: 8,
  },
  registerButton: {
    marginTop: 8,
  },
});
