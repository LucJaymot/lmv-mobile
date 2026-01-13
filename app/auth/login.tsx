
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
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

// Validation email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      console.log('User is logged in, redirecting to dashboard...');
      if (user.role === 'client') {
        router.replace('/(client)/(tabs)/dashboard');
      } else if (user.role === 'provider') {
        router.replace('/(provider)/(tabs)/dashboard');
      } else if (user.role === 'admin') {
        router.replace('/(admin)/dashboard');
      }
    }
  }, [user]);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);

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
    }

    return isValid;
  };

  const handleLogin = async () => {
    // Réinitialiser les erreurs
    setEmailError(null);
    setPasswordError(null);

    // Validation du formulaire
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      console.log('Login successful, user should be redirected');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Analyser le message d'erreur pour afficher un message spécifique
      const errorMessage = error.message || '';
      
      // Supabase ne distingue pas entre "email n'existe pas" et "mot de passe incorrect" pour des raisons de sécurité
      // Mais on peut quand même améliorer les messages
      if (errorMessage.includes('Invalid login credentials') || 
          errorMessage.includes('email not confirmed') ||
          errorMessage.includes('Email not confirmed')) {
        // Erreur générique d'authentification (email ou mot de passe incorrect)
        Alert.alert(
          'Erreur de connexion',
          'L\'email ou le mot de passe est incorrect. Veuillez vérifier vos identifiants.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('email not confirmed') || errorMessage.includes('Email not confirmed')) {
        Alert.alert(
          'Email non confirmé',
          'Votre email n\'a pas été confirmé. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Erreur', errorMessage || 'Une erreur est survenue lors de la connexion');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Réinitialiser l'erreur email quand l'utilisateur tape
    if (emailError) {
      setEmailError(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Réinitialiser l'erreur mot de passe quand l'utilisateur tape
    if (passwordError) {
      setPasswordError(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec logo et titre */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <IconSymbol
                  ios_icon_name="car.fill"
                  android_material_icon_name="directions-car"
                  size={48}
                  color={colors.primary}
                />
              </View>
            </View>
            <Text style={styles.title}>Lave ma voiture</Text>
            <Text style={styles.subtitle}>Bienvenue, connectez-vous à votre compte</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
                emailError && styles.inputWrapperError,
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
                  editable={!isLoading}
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
                passwordFocused && styles.inputWrapperFocused,
                passwordError && styles.inputWrapperError,
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
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
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

            {/* Mot de passe oublié */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton de connexion */}
            <TouchableOpacity
              style={[
                buttonStyles.primary,
                styles.loginButton,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={commonStyles.buttonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>ou</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Lien d'inscription */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Pas encore de compte ? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/auth/register')} 
                disabled={isLoading}
              >
                <Text style={styles.registerLink}>S&apos;inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 123, 255, 0.15)',
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
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
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    boxShadow: `0px 0px 0px 3px ${colors.primary}20`,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: colors.error,
    boxShadow: `0px 0px 0px 3px ${colors.error}20`,
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
    color: colors.error,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  registerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
});
