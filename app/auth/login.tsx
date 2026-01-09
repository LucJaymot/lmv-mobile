
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

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      console.log('Login successful, user should be redirected');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Erreur', error.message || 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="car.fill"
            android_material_icon_name="directions-car"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.title}>Lave ma voiture</Text>
          <Text style={styles.subtitle}>Connexion</Text>
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
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={commonStyles.inputLabel}>Mot de passe</Text>
            <TextInput
              style={commonStyles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttonStyles.primary, styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={commonStyles.buttonText}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={commonStyles.textSecondary}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')} disabled={isLoading}>
              <Text style={styles.registerLink}>S&apos;inscrire</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
