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
import { commonStyles } from '@/styles/commonStyles';
import { Button } from '@/components/ui/Button';
import { ServiceType } from '@/types';
import { useTheme } from '@/theme/hooks';

export default function EditProviderProfileScreen() {
  const router = useRouter();
  const { provider, updateProfile } = useAuth();
  const { theme } = useTheme();
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
      // Si le service est déjà sélectionné, on le désélectionne
      // Sinon, on remplace la sélection précédente par le nouveau service
      services: prev.services.includes(service)
        ? []
        : [service],
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
      Alert.alert('Erreur', 'Veuillez sélectionner un service');
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
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
                placeholderTextColor={theme.colors.textMuted}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Téléphone *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Numéro de téléphone"
                placeholderTextColor={theme.colors.textMuted}
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
                placeholderTextColor={theme.colors.textMuted}
                value={formData.baseCity}
                onChangeText={(text) => setFormData({ ...formData, baseCity: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Rayon d'intervention (km) *</Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Rayon en kilomètres"
                placeholderTextColor={theme.colors.textMuted}
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
                placeholderTextColor={theme.colors.textMuted}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Services proposés *</Text>
              <View style={styles.servicesContainer}>
                {(['exterior', 'interior', 'complete'] as ServiceType[]).map((service) => {
                  const isActive = formData.services.includes(service);
                  return (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.serviceChip,
                        {
                          borderColor: isActive ? theme.colors.accent : theme.colors.border,
                          backgroundColor: isActive ? theme.colors.accent : theme.colors.background,
                        },
                      ]}
                      onPress={() => toggleService(service)}
                    >
                      <Text
                        style={[
                          styles.serviceChipText,
                          {
                            color: isActive ? '#FFFFFF' : theme.colors.text,
                          },
                        ]}
                      >
                        {getServiceLabel(service)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  formContainer: {
    backgroundColor: commonStyles.card.backgroundColor,
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
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: '500',
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
});

