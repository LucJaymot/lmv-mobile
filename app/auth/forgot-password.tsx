
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
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authService } from '@/services/databaseService';

// Validation email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleResetPassword = async () => {
    // Réinitialiser l'erreur
    setEmailError(null);

    // Validation
    if (!email.trim()) {
      setEmailError('L\'email est requis');
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError('Le format de l\'email n\'est pas valide');
      return;
    }

    setIsLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Vérifier si l'email existe en base de données
      const emailExists = await authService.checkEmailExists(normalizedEmail);
      
      if (!emailExists) {
        setEmailError('Cet email n\'existe pas dans notre base de données');
        setIsLoading(false);
        return;
      }

      // Envoyer l'email de réinitialisation
      // Note: Pour le web, vous devrez configurer l'URL de redirection dans Supabase
      // Par exemple: http://localhost:8081/auth/reset-password
      const redirectUrl = Platform.OS === 'web' 
        ? `${window.location.origin}/auth/reset-password`
        : 'lmv://auth/reset-password';

      await authService.resetPasswordForEmail(normalizedEmail, redirectUrl);
      
      setEmailSent(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Gérer les erreurs spécifiques
      if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        Alert.alert(
          'Trop de tentatives',
          'Vous avez effectué trop de demandes. Veuillez attendre quelques minutes avant de réessayer.'
        );
      } else {
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de l\'envoi de l\'email. Veuillez réessayer.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError(null);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.container}>
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
              <Text style={styles.successTitle}>Email envoyé !</Text>
              <Text style={styles.successText}>
                Un email de réinitialisation a été envoyé à{'\n'}
                <Text style={styles.emailText}>{email}</Text>
                {'\n\n'}
                Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de passe.
              </Text>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.button]}
                onPress={() => router.back()}
              >
                <Text style={commonStyles.buttonText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.title}>Mot de passe oublié</Text>
            <Text style={styles.subtitle}>
              Entrez votre email pour recevoir un lien de réinitialisation
            </Text>
          </View>

          <View style={styles.form}>
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
                  returnKeyType="send"
                  onSubmitEditing={handleResetPassword}
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

            <TouchableOpacity
              style={[
                buttonStyles.primary,
                styles.button,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={commonStyles.buttonText}>Envoyer le lien</Text>
              )}
            </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 20,
    left: 24,
    padding: 8,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 4px 12px rgba(0, 123, 255, 0.15)',
    elevation: 4,
  },
  title: {
    fontSize: 28,
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
    marginBottom: 24,
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
  button: {
    marginBottom: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
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
});
