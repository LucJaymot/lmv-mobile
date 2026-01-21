
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors } from '@/styles/commonStyles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';
import { IconSymbol } from '@/components/IconSymbol';
import { authService } from '@/services/databaseService';
import { useTheme } from '@/theme/hooks';

// Validation email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useAuth();
  const { theme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);

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
      
      // Email non confirmé
      if (errorMessage.includes('email n\'a pas été confirmé') || 
          errorMessage.includes('email not confirmed') || 
          errorMessage.includes('Email not confirmed')) {
        setEmailError('Votre email n\'a pas été confirmé. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation. Si vous avez déjà cliqué sur le lien, attendez quelques instants et réessayez.');
      } else if (errorMessage.includes('Invalid login credentials')) {
        // Supabase renvoie ce message pour email OU mot de passe incorrect.
        // On tente d'améliorer l'UX en vérifiant si l'email existe.
        try {
          const normalizedEmail = email.trim().toLowerCase();
          const exists = await authService.checkEmailExists(normalizedEmail);
          if (exists) {
            setPasswordError('Mot de passe incorrect. Veuillez réessayer.');
          } else {
            setEmailError('Cet email n\'existe pas. Veuillez vérifier ou créer un compte.');
          }
        } catch {
          // Fallback si la vérif échoue
          setPasswordError('L\'email ou le mot de passe est incorrect. Veuillez vérifier vos identifiants.');
        }
      } else {
        setPasswordError(errorMessage || 'Une erreur est survenue lors de la connexion');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Réinitialiser l'erreur email et l'état de confirmation quand l'utilisateur tape
    if (emailError) {
      setEmailError(null);
    }
    if (confirmationEmailSent) {
      setConfirmationEmailSent(false);
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
          {/* Header avec logo et titre */}
          <View style={styles.header}>
            <Logo size="lg" withCircleBackground forceStaticColors />
            <Text style={styles.title}>Lave ma voiture</Text>
            <Text style={styles.subtitle}>Bienvenue, connectez-vous à votre compte</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            {/* Email Input */}
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              error={emailError && !emailError.includes('n\'a pas été confirmé') && !emailError.includes('not confirmed') ? emailError : undefined}
              forceStaticColors
              leftIcon={
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={20}
                  color={emailError && !emailError.includes('n\'a pas été confirmé') && !emailError.includes('not confirmed') ? colors.error : colors.textSecondary}
                />
              }
            />
            
            {/* Message d'alerte pour email non confirmé */}
            {emailError && (emailError.includes('n\'a pas été confirmé') || emailError.includes('not confirmed')) && (
              <View style={[styles.emailConfirmationAlert, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertContent}>
                    <View style={styles.alertTitleContainer}>
                      <Text style={[styles.alertTitle, { color: colors.text }]}>
                        Email non confirmé
                      </Text>
                      <View style={[styles.alertIconContainer, { backgroundColor: colors.error + '15' }]}>
                        <IconSymbol
                          ios_icon_name="exclamationmark.triangle.fill"
                          android_material_icon_name="warning"
                          size={20}
                          color={colors.error}
                        />
                      </View>
                    </View>
                    <View style={styles.alertMessageContainer}>
                      <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
                        Vérifiez votre boîte de réception et cliquez sur le lien de confirmation. Si vous avez déjà cliqué sur le lien, attendez quelques instants et réessayez.
                      </Text>
                      {confirmationEmailSent ? (
                        <View style={styles.successContainer}>
                          <IconSymbol
                            ios_icon_name="checkmark.circle.fill"
                            android_material_icon_name="check-circle"
                            size={20}
                            color={colors.success || '#10B981'}
                          />
                          <Text style={[styles.successText, { color: colors.success || '#10B981' }]}>
                            Email envoyé avec succès
                          </Text>
                        </View>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={async () => {
                            if (!email.trim()) {
                              Alert.alert('Erreur', 'Veuillez entrer votre email');
                              return;
                            }
                            setIsResendingConfirmation(true);
                            setConfirmationEmailSent(false);
                            try {
                              await authService.resendConfirmationEmail(email.trim());
                              setConfirmationEmailSent(true);
                              // Réinitialiser après 5 secondes pour permettre un nouveau renvoi
                              setTimeout(() => {
                                setConfirmationEmailSent(false);
                              }, 5000);
                            } catch (error: any) {
                              console.error('Erreur lors du renvoi de l\'email:', error);
                              Alert.alert(
                                'Erreur',
                                error.message || 'Impossible d\'envoyer l\'email de confirmation. Veuillez réessayer plus tard.'
                              );
                            } finally {
                              setIsResendingConfirmation(false);
                            }
                          }}
                          disabled={isResendingConfirmation || isLoading}
                          loading={isResendingConfirmation}
                          style={styles.resendButton}
                        >
                          Renvoyer l'email de confirmation
                        </Button>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Password Input */}
            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              error={passwordError || undefined}
              forceStaticColors
              leftIcon={
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={passwordError ? colors.error : colors.textSecondary}
                />
              }
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  hitSlop={8}
                >
                  <IconSymbol
                    ios_icon_name={showPassword ? "eye.slash.fill" : "eye.fill"}
                    android_material_icon_name={showPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
              onSubmitEditing={handleLogin}
                  />

            {/* Mot de passe oublié */}
            <Button
              variant="text"
              size="sm"
              onPress={() => router.push('/auth/forgot-password')}
              disabled={isLoading}
              style={styles.forgotPassword}
            >
              Mot de passe oublié ?
            </Button>

            {/* Bouton de connexion */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleLogin}
              disabled={isLoading}
              loading={isLoading}
              style={styles.loginButton}
            >
              Se connecter
            </Button>

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
              <Text style={styles.separatorText}>ou</Text>
              <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Lien d'inscription */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Pas encore de compte ? </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/register')}
                disabled={isLoading}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={[styles.registerLink, { color: theme.colors.accent }]}>
                  S&apos;inscrire
                </Text>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -8,
  },
  loginButton: {
    marginBottom: 24,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 16,
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
    fontWeight: '600',
  },
  emailConfirmationAlert: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertContent: {
    flex: 1,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  alertMessageContainer: {
    gap: 12,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  resendButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
  },
});


