
import React, { useState, useRef, useEffect } from 'react';
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
import { commonStyles, buttonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Logo } from '@/components/Logo';
import { UserRole } from '@/types';
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
  const [emailSent, setEmailSent] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState<boolean>(false);
  const isRegisteringRef = useRef(false);

  // Empêcher la redirection automatique pendant l'inscription
  useEffect(() => {
    if (user && !isRegisteringRef.current && !emailSent) {
      // Si l'utilisateur est connecté mais qu'on n'est pas en train de s'inscrire,
      // rediriger vers le dashboard (cas normal de connexion)
      console.log('User connected, redirecting to dashboard...');
      if (user.role === 'client') {
        router.replace('/(client)/(tabs)/dashboard');
      } else if (user.role === 'provider') {
        router.replace('/(provider)/(tabs)/dashboard');
      } else if (user.role === 'admin') {
        router.replace('/(admin)/dashboard');
      }
    }
  }, [user, emailSent]);

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
    isRegisteringRef.current = true; // Marquer qu'on est en train de s'inscrire
    try {
      console.log('Appel de register()...');
      const result = await register(email, password, role, profileData);
      console.log('✅ Registration successful...');
      
      // Vérifier si l'utilisateur est déjà confirmé (auto-confirm activé)
      // Si oui, aucun email n'est envoyé
      const isConfirmed = result?.user?.email_confirmed_at !== null && result?.user?.email_confirmed_at !== undefined;
      setUserConfirmed(isConfirmed);
      
      console.log('User confirmed:', isConfirmed ? 'OUI (auto-confirm activé)' : 'NON (email envoyé)');
      
      // Afficher le message de confirmation d'email
      setEmailSent(true);
      
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
      // Attendre un peu avant de permettre la redirection
      setTimeout(() => {
        isRegisteringRef.current = false;
      }, 1000);
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

  // Afficher l'écran de confirmation après l'inscription réussie
  if (emailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={64}
                  color={colors.success}
                />
              </View>
              <Text style={styles.successTitle}>Inscription réussie !</Text>
              <Text style={styles.successText}>
                {userConfirmed ? (
                  <>
                    Votre compte a été créé avec succès !{'\n\n'}
                    <Text style={styles.emailText}>{email}</Text>
                    {'\n\n'}
                    <Text style={{ fontWeight: '600', color: colors.text }}>
                      ⚠️ Aucun email de confirmation n'a été envoyé car la confirmation automatique est activée dans Supabase.
                    </Text>
                    {'\n\n'}
                    Vous pouvez vous connecter immédiatement avec vos identifiants.
                    {'\n\n'}
                    <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.textSecondary }}>
                      Pour recevoir des emails de confirmation, activez &quot;Enable email confirmations&quot; dans Supabase {'>'} Authentication {'>'} Settings.
                    </Text>
                  </>
                ) : (
                  <>
                    Un email de confirmation a été envoyé à{'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                    {'\n\n'}
                    Veuillez vérifier votre boîte de réception (et votre dossier spam) et cliquer sur le lien de confirmation pour activer votre compte.
                    {'\n\n'}
                    <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.textSecondary }}>
                      Si vous ne recevez pas l'email dans quelques minutes, vérifiez vos paramètres Supabase ou contactez le support.
                    </Text>
                  </>
                )}
              </Text>
              <Button
                variant="primary"
                size="lg"
                onPress={() => router.replace('/auth/login')}
                style={styles.button}
              >
                Retour à la connexion
              </Button>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'role') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/auth/login')}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <Logo size="lg" withCircleBackground forceStaticColors />
            <Text style={styles.title}>Inscription</Text>
            <Text style={styles.subtitle}>Choisissez votre profil</Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleCard, { backgroundColor: colors.card }]}
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
              style={[styles.roleCard, { backgroundColor: colors.card }]}
              onPress={() => handleRoleSelection('provider')}
            >
              <IconSymbol
                ios_icon_name="sparkles"
                android_material_icon_name="local-car-wash"
                size={48}
                color={colors.primary}
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: emailError ? colors.error : (emailFocused ? colors.primary : colors.border),
                },
                emailFocused && { borderColor: colors.primary },
                emailError && { borderColor: colors.error },
              ]}>
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={20}
                  color={emailError ? colors.error : (emailFocused ? colors.primary : colors.textSecondary)}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.textSecondary}
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
                    color={colors.error}
                    style={styles.errorIcon}
                  />
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <View style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: passwordError ? colors.error : (passwordFocused ? colors.primary : colors.border),
                },
                passwordFocused && { borderColor: colors.primary },
                passwordError && { borderColor: colors.error },
              ]}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={passwordError ? colors.error : (passwordFocused ? colors.primary : colors.textSecondary)}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 caractères"
                  placeholderTextColor={colors.textSecondary}
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
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError && (
                <View style={styles.errorContainer}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.circle.fill"
                    android_material_icon_name="error"
                    size={14}
                    color={colors.error}
                    style={styles.errorIcon}
                  />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <View style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: confirmPasswordError ? colors.error : (confirmPasswordFocused ? colors.primary : colors.border),
                },
                confirmPasswordFocused && { borderColor: colors.primary },
                confirmPasswordError && { borderColor: colors.error },
              ]}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={confirmPasswordError ? colors.error : (confirmPasswordFocused ? colors.primary : colors.textSecondary)}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Retapez votre mot de passe"
                  placeholderTextColor={colors.textSecondary}
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
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError && (
                <View style={styles.errorContainer}>
                  <IconSymbol
                    ios_icon_name="exclamationmark.circle.fill"
                    android_material_icon_name="error"
                    size={14}
                    color={colors.error}
                    style={styles.errorIcon}
                  />
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
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
      style={[styles.container, { backgroundColor: colors.background }]}
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
              {/* Nom de l'entreprise */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nom de l&apos;entreprise *</Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: clientNameError ? colors.error : (clientNameFocused ? colors.primary : colors.border),
                  },
                  clientNameFocused && { borderColor: colors.primary },
                  clientNameError && { borderColor: colors.error },
                ]}>
                  <IconSymbol
                    ios_icon_name="building.2.fill"
                    android_material_icon_name="business"
                    size={20}
                    color={clientNameError ? colors.error : (clientNameFocused ? colors.primary : colors.textSecondary)}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Garage Dupont"
                    placeholderTextColor={colors.textSecondary}
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
                      color={colors.error}
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{clientNameError}</Text>
                  </View>
                )}
              </View>

              {/* Adresse */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Adresse *</Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: clientAddressError ? colors.error : (clientAddressFocused ? colors.primary : colors.border),
                  },
                  clientAddressFocused && { borderColor: colors.primary },
                  clientAddressError && { borderColor: colors.error },
                ]}>
                  <IconSymbol
                    ios_icon_name="location.fill"
                    android_material_icon_name="location-on"
                    size={20}
                    color={clientAddressError ? colors.error : (clientAddressFocused ? colors.primary : colors.textSecondary)}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="123 Rue de la Paix, 75001 Paris"
                    placeholderTextColor={colors.textSecondary}
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
                      color={colors.error}
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{clientAddressError}</Text>
                  </View>
                )}
              </View>

              {/* Nom du contact */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nom du contact *</Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: clientContactError ? colors.error : (clientContactFocused ? colors.primary : colors.border),
                  },
                  clientContactFocused && { borderColor: colors.primary },
                  clientContactError && { borderColor: colors.error },
                ]}>
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={20}
                    color={clientContactError ? colors.error : (clientContactFocused ? colors.primary : colors.textSecondary)}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Jean Dupont"
                    placeholderTextColor={colors.textSecondary}
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
                      color={colors.error}
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{clientContactError}</Text>
                  </View>
                )}
              </View>

              {/* Téléphone */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Téléphone *</Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.card,
                    borderColor: clientPhoneError ? colors.error : (clientPhoneFocused ? colors.primary : colors.border),
                  },
                  clientPhoneFocused && { borderColor: colors.primary },
                  clientPhoneError && { borderColor: colors.error },
                ]}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={20}
                    color={clientPhoneError ? colors.error : (clientPhoneFocused ? colors.primary : colors.textSecondary)}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="0123456789"
                    placeholderTextColor={colors.textSecondary}
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
                      color={colors.error}
                      style={styles.errorIcon}
                    />
                    <Text style={styles.errorText}>{clientPhoneError}</Text>
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
                  {(['exterior', 'interior', 'complete'] as string[]).map((service) => {
                    const isActive = providerData.services.includes(service);
                    return (
                      <TouchableOpacity
                        key={service}
                        style={[
                          styles.serviceChip,
                          {
                    borderColor: isActive ? colors.primary : colors.border,
                    backgroundColor: isActive ? colors.primary : colors.background,
                          },
                        ]}
                        onPress={() => toggleService(service)}
                      >
                        <Text
                          style={[
                            styles.serviceChipText,
                            {
                              color: isActive ? '#FFFFFF' : colors.text,
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
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
    color: colors.text,
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
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
    color: colors.text,
  },
  button: {
    minWidth: 200,
  },
});
