
import React, { useState, useEffect } from 'react';
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
import { useTheme } from '@/theme/hooks';
import { createTextStyles } from '@/theme/styles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const textStyles = createTextStyles(theme);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  // Vérifier si le token est présent dans l'URL et créer une session
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Sur web, le token est dans le hash de l'URL
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
            // Extraire les paramètres du hash
            const hashParams = new URLSearchParams(hash.substring(1)); // Enlever le #
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const expiresAt = hashParams.get('expires_at');
            const tokenType = hashParams.get('token_type') || 'bearer';
            const type = hashParams.get('type');

            // Vérifier que c'est bien un token de réinitialisation
            if (type !== 'recovery') {
              console.error('Token type is not recovery:', type);
              setIsTokenValid(false);
              return;
            }

            if (accessToken && refreshToken) {
              // Créer une session avec le token
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (error || !data.session) {
                console.error('Error setting session:', error);
                setIsTokenValid(false);
                return;
              }

              // Nettoyer le hash de l'URL pour éviter de le réutiliser
              window.history.replaceState(null, '', window.location.pathname);
              
              setIsTokenValid(true);
            } else {
              setIsTokenValid(false);
            }
          } else {
            // Vérifier si une session existe déjà (peut-être créée automatiquement)
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
              setIsTokenValid(false);
              return;
            }
            // Vérifier que la session est bien une session de réinitialisation
            // (on peut vérifier le type dans les métadonnées si nécessaire)
            setIsTokenValid(true);
          }
        } else {
          // Sur mobile, le token devrait être passé via deep linking
          // Vérifier si une session existe
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error || !session) {
            setIsTokenValid(false);
            return;
          }
          setIsTokenValid(true);
        }
      } catch (error) {
        console.error('Error checking token:', error);
        setIsTokenValid(false);
      }
    };

    checkToken();
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;
    setPasswordError(null);
    setConfirmPasswordError(null);

    // Validation mot de passe
    if (!password) {
      setPasswordError('Le mot de passe est requis');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      isValid = false;
    }

    // Validation confirmation
    if (!confirmPassword) {
      setConfirmPasswordError('La confirmation du mot de passe est requise');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      isValid = false;
    }

    return isValid;
  };

  const handleResetPassword = async () => {
    // Réinitialiser les erreurs
    setPasswordError(null);
    setConfirmPasswordError(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validation du formulaire
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 reset-password: tentative updateUser(password)');
      // Mettre à jour le mot de passe avec Supabase
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password update error:', error);
        setSubmitError(error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe');
        
        if (error.message?.includes('token') || error.message?.includes('expired')) {
          Alert.alert(
            'Lien expiré',
            'Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/auth/forgot-password'),
              },
            ]
          );
        } else {
          Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe');
        }
        return;
      }

      // Succès
      console.log('✅ reset-password: mot de passe mis à jour', { userId: data.user?.id });
      setSubmitSuccess('Mot de passe réinitialisé. Redirection vers la connexion…');
      Alert.alert(
        'Mot de passe réinitialisé',
        'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
      // Sur web, Alert peut être silencieux : on redirige quand même.
      setTimeout(() => {
        router.replace('/auth/login');
      }, 900);
    } catch (error: any) {
      console.error('Reset password error:', error);
      const msg = error?.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe';
      setSubmitError(msg);
      Alert.alert('Erreur', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) {
      setPasswordError(null);
    }
    // Réinitialiser aussi l'erreur de confirmation si les mots de passe correspondent maintenant
    if (confirmPassword && text === confirmPassword && confirmPasswordError) {
      setConfirmPasswordError(null);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) {
      setConfirmPasswordError(null);
    }
  };

  // Afficher un message si le token n'est pas valide
  if (isTokenValid === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.errorContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle.fill"
                android_material_icon_name="error"
                size={64}
                color={theme.colors.error}
              />
              <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Lien invalide ou expiré</Text>
              <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>
                Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
              </Text>
              <Button
                variant="primary"
                size="lg"
                onPress={() => router.replace('/auth/forgot-password')}
                style={styles.button}
              >
                Demander un nouveau lien
              </Button>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Afficher un loader pendant la vérification du token
  if (isTokenValid === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[textStyles.body, { color: theme.colors.textMuted }]}>Vérification du lien...</Text>
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
                ios_icon_name="lock.rotation"
                android_material_icon_name="lock-reset"
                size={48}
                color={theme.colors.accent}
              />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Réinitialiser le mot de passe</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Entrez votre nouveau mot de passe
            </Text>
          </View>

          <View style={styles.form}>
            {/* Nouveau mot de passe */}
            <Input
              label="Nouveau mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
              error={passwordError || undefined}
              leftIcon={
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={passwordError ? theme.colors.error : theme.colors.textMuted}
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
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            {/* Confirmation du mot de passe */}
            <Input
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isLoading}
              error={confirmPasswordError || undefined}
              leftIcon={
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={confirmPasswordError ? theme.colors.error : theme.colors.textMuted}
                />
              }
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  hitSlop={8}
                >
                  <IconSymbol
                    ios_icon_name={showConfirmPassword ? "eye.slash.fill" : "eye.fill"}
                    android_material_icon_name={showConfirmPassword ? "visibility-off" : "visibility"}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              }
              onSubmitEditing={handleResetPassword}
            />

            {!!submitError && (
              <Text style={[styles.inlineMessage, { color: theme.colors.error }]}>
                {submitError}
              </Text>
            )}
            {!!submitSuccess && (
              <Text style={[styles.inlineMessage, { color: theme.colors.success }]}>
                {submitSuccess}
              </Text>
            )}

            {/* Bouton de réinitialisation */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleResetPassword}
              disabled={isLoading}
              loading={isLoading}
              style={styles.button}
            >
              Réinitialiser le mot de passe
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
    textAlign: 'center',
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
  inlineMessage: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});

