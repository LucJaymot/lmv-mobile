
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
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { authService } from '@/services/databaseService';
import { useTheme } from '@/theme/hooks';
import { Button } from '@/components/ui/Button';

// Validation email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={64}
                  color={theme.colors.success}
                />
              </View>
              <Text style={[styles.successTitle, { color: theme.colors.text }]}>Email envoyé !</Text>
              <Text style={[styles.successText, { color: theme.colors.textMuted }]}>
                Un email de réinitialisation a été envoyé à{'\n'}
                <Text style={[styles.emailText, { color: theme.colors.text }]}>{email}</Text>
                {'\n\n'}
                Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de passe.
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
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={48}
                color={theme.colors.accent}
              />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Mot de passe oublié</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Entrez votre email pour recevoir un lien de réinitialisation
            </Text>
          </View>

          <View style={styles.form}>
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
                    color={theme.colors.error}
                    style={styles.errorIcon}
                  />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>{emailError}</Text>
                </View>
              )}
            </View>

            <Button
              variant="primary"
              size="lg"
              onPress={handleResetPassword}
              disabled={isLoading}
              loading={isLoading}
              style={styles.button}
            >
              Envoyer le lien
            </Button>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
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
  button: {
    marginBottom: 16,
    minHeight: 52,
    justifyContent: 'center',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
  },
});
