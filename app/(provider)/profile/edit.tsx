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
import { Button } from '@/components/ui/Button';
import { ServiceType } from '@/types';

export default function EditProviderProfileScreen() {
  const router = useRouter();
  const { provider, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    phone: provider?.phone || '',
    baseCity: provider?.baseCity || '',
    radiusKm: provider?.radiusKm?.toString() || '20',
    description: provider?.description || '',
    services: (provider?.services || []) as ServiceType[],
  });

  // Mettre à jour le formulaire quand provider change
  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        phone: provider.phone || '',
        baseCity: provider.baseCity || '',
        radiusKm: provider.radiusKm?.toString() || '20',
        description: provider.description || '',
        services: provider.services || [],
      });
    }
  }, [provider]);

  const toggleService = (service: ServiceType) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const getServiceLabel = (service: ServiceType) => {
    switch (service) {
      case 'exterior':
        return 'Extérieur';
      case 'interior':
        return 'Intérieur';
      case 'complete':
        return 'Complet';
      default:
        return service;
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.baseCity) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const radiusKm = parseInt(formData.radiusKm, 10);
    if (isNaN(radiusKm) || radiusKm < 1) {
      Alert.alert('Erreur', 'Le rayon doit être un nombre positif');
      return;
    }

    if (formData.services.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un service');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        baseCity: formData.baseCity.trim(),
        radiusKm: radiusKm,
        description: formData.description.trim() || null,
        services: formData.services,
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
              <Text style={commonStyles.inputLabel}>Nom *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Nom du prestataire"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
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
              <Text style={commonStyles.inputLabel}>Ville de base *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Ville principale"
                placeholderTextColor={colors.textSecondary}
                value={formData.baseCity}
                onChangeText={(text) => setFormData({ ...formData, baseCity: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Rayon d'intervention (km) *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Rayon en kilomètres"
                placeholderTextColor={colors.textSecondary}
                value={formData.radiusKm}
                onChangeText={(text) => setFormData({ ...formData, radiusKm: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Description</Text>
              <TextInput
                style={[commonStyles.input, styles.textArea]}
                placeholder="Description de vos services"
                placeholderTextColor={colors.textSecondary}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Services proposés *</Text>
              <View style={styles.servicesContainer}>
                {(['exterior', 'interior', 'complete'] as ServiceType[]).map((service) => (
                  <TouchableOpacity
                    key={service}
                    style={[
                      styles.serviceChip,
                      formData.services.includes(service) && styles.serviceChipActive,
                    ]}
                    onPress={() => toggleService(service)}
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        formData.services.includes(service) && styles.serviceChipTextActive,
                      ]}
                    >
                      {getServiceLabel(service)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <Button
                variant="ghost"
                size="md"
                onPress={() => router.back()}
                disabled={isSaving}
                style={styles.button}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="md"
                onPress={handleSave}
                disabled={isSaving}
                loading={isSaving}
                style={styles.button}
              >
                Enregistrer
              </Button>
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  serviceChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  serviceChipTextActive: {
    color: '#FFFFFF',
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

