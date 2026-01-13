import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Validation email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation téléphone (format français : 9-15 chiffres)
const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\.\-\(\)]/g, '');
  return /^[0-9]{9,15}$/.test(cleanPhone);
};

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
  const [errors, setErrors] = useState<{
    name?: string;
    contact?: string;
    phone?: string;
    address?: string;
    email?: string;
  }>({});

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
      setErrors({});
    }
  }, [clientCompany]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validation nom de l'entreprise
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'entreprise est requis';
    }

    // Validation contact
    if (!formData.contact.trim()) {
      newErrors.contact = 'Le nom du contact est requis';
    }

    // Validation téléphone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!validatePhone(formData.phone.trim())) {
      newErrors.phone = 'Le format du téléphone n\'est pas valide (9-15 chiffres)';
    }

    // Validation email
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Le format de l\'email n\'est pas valide';
    }

    // Validation adresse
    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
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
      
      // Gérer les erreurs spécifiques de l'API
      let errorMessage = 'Impossible de mettre à jour le profil';
      const newErrors: typeof errors = {};
      
      if (error.message) {
        errorMessage = error.message;
        // Si l'erreur concerne un champ spécifique, l'afficher sous le champ
        if (error.message.toLowerCase().includes('email')) {
          newErrors.email = error.message;
        } else if (error.message.toLowerCase().includes('téléphone') || error.message.toLowerCase().includes('phone')) {
          newErrors.phone = error.message;
        } else {
          Alert.alert('Erreur', errorMessage);
        }
        
        if (Object.keys(newErrors).length > 0) {
          setErrors({ ...errors, ...newErrors });
        }
      } else {
        Alert.alert('Erreur', errorMessage);
      }
      
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
            <Input
              label="Nom de l'entreprise *"
              placeholder="Nom de l'entreprise"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              error={errors.name}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Contact *"
              placeholder="Nom du contact"
              value={formData.contact}
              onChangeText={(text) => {
                setFormData({ ...formData, contact: text });
                if (errors.contact) {
                  setErrors({ ...errors, contact: undefined });
                }
              }}
              error={errors.contact}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Téléphone *"
              placeholder="Numéro de téléphone"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                if (errors.phone) {
                  setErrors({ ...errors, phone: undefined });
                }
              }}
              error={errors.phone}
              keyboardType="phone-pad"
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Email *"
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (errors.email) {
                  setErrors({ ...errors, email: undefined });
                }
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Adresse *"
              placeholder="Adresse complète"
              value={formData.address}
              onChangeText={(text) => {
                setFormData({ ...formData, address: text });
                if (errors.address) {
                  setErrors({ ...errors, address: undefined });
                }
              }}
              error={errors.address}
              multiline
              numberOfLines={3}
              inputStyle={styles.textArea}
              containerStyle={styles.inputContainer}
            />

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
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
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

