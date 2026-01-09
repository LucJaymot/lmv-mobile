import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

export default function EditProfileScreen() {
  const router = useRouter();
  const { clientCompany, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: clientCompany?.name || '',
    contact: clientCompany?.contact || '',
    phone: clientCompany?.phone || '',
    address: clientCompany?.address || '',
    email: clientCompany?.email || '',
  });

  // Mettre à jour le formulaire quand clientCompany change
  useEffect(() => {
    if (clientCompany) {
      setFormData({
        name: clientCompany.name || '',
        contact: clientCompany.contact || '',
        phone: clientCompany.phone || '',
        address: clientCompany.address || '',
        email: clientCompany.email || '',
      });
    }
  }, [clientCompany]);

  const handleSave = async () => {
    if (!formData.name || !formData.contact || !formData.phone || !formData.address || !formData.email) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        email: formData.email.trim(),
      });
      router.back();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Nom de l'entreprise *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Nom de l'entreprise"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Contact *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Nom du contact"
                placeholderTextColor={colors.textSecondary}
                value={formData.contact}
                onChangeText={(text) => setFormData({ ...formData, contact: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Téléphone *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Numéro de téléphone"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Email *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Adresse *</Text>
              <TextInput
                style={[commonStyles.input, styles.textArea]}
                placeholder="Adresse complète"
                placeholderTextColor={colors.textSecondary}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.button]}
                onPress={() => router.back()}
                disabled={isSaving}
              >
                <Text style={commonStyles.buttonTextOutline}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.button, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={commonStyles.buttonText}>Enregistrer</Text>
                )}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

