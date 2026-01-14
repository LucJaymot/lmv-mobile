
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
import { useTheme } from '@/theme/hooks';
import { createTextStyles, createStyles } from '@/theme/styles';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';
import { IconSymbol } from '@/components/IconSymbol';

// Validation email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useAuth();
  const { theme } = useTheme();
  const textStyles = createTextStyles(theme);
  const createStylesWithTheme = createStyles(theme);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
          {/* Header avec logo et titre */}
          <View style={styles.header}>
            <Logo size="lg" withCircleBackground />
            <Text style={[textStyles.h1, styles.title]}>Lave ma voiture</Text>
            <Text style={[textStyles.body, styles.subtitle]}>Bienvenue, connectez-vous à votre compte</Text>
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
              error={emailError || undefined}
              leftIcon={
                <IconSymbol
                  ios_icon_name="envelope.fill"
                  android_material_icon_name="email"
                  size={20}
                  color={emailError ? theme.colors.error : theme.colors.textMuted}
                />
              }
            />

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
              <View style={[styles.separatorLine, { backgroundColor: theme.colors.divider }]} />
              <Text style={[textStyles.bodySmall, styles.separatorText]}>ou</Text>
              <View style={[styles.separatorLine, { backgroundColor: theme.colors.divider }]} />
            </View>

            {/* Lien d'inscription */}
            <View style={styles.registerContainer}>
              <Text style={[textStyles.bodySmall, { color: theme.colors.textMuted }]}>Pas encore de compte ? </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/register')}
                disabled={isLoading}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={[textStyles.bodySmall, { color: theme.colors.accent, fontWeight: '600' }]}>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
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
    paddingHorizontal: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});


