
import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { vehicleService } from '@/services/databaseService';
import { washRequestService } from '@/services/databaseService';
import { Vehicle } from '@/types';

// Composant pour le sélecteur de date web
const WebDateInput = ({ value, onChange, min, style }: any) => {
  if (Platform.OS !== 'web') return null;
  
  useEffect(() => {
    // Ajouter un style CSS pour colorer les séparateurs en gris et mettre en majuscules
    const styleId = 'date-time-input-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `
        input[type="date"],
        input[type="time"] {
          text-transform: uppercase;
          font-variant: normal;
        }
        input[type="date"]::-webkit-datetime-edit,
        input[type="time"]::-webkit-datetime-edit {
          padding-left: 8px;
        }
        input[type="date"]:invalid::-webkit-datetime-edit,
        input[type="time"]:invalid::-webkit-datetime-edit {
          color: #666666;
        }
        input[type="date"]:invalid::-webkit-datetime-edit-text,
        input[type="date"]:invalid::-webkit-datetime-edit-month-field,
        input[type="date"]:invalid::-webkit-datetime-edit-day-field,
        input[type="date"]:invalid::-webkit-datetime-edit-year-field,
        input[type="time"]:invalid::-webkit-datetime-edit-text,
        input[type="time"]:invalid::-webkit-datetime-edit-hour-field,
        input[type="time"]:invalid::-webkit-datetime-edit-minute-field {
          color: #666666;
          text-transform: uppercase;
        }
        input[type="date"]:valid::-webkit-datetime-edit-text,
        input[type="date"]:valid::-webkit-datetime-edit-month-field,
        input[type="date"]:valid::-webkit-datetime-edit-day-field,
        input[type="date"]:valid::-webkit-datetime-edit-year-field,
        input[type="time"]:valid::-webkit-datetime-edit-text,
        input[type="time"]:valid::-webkit-datetime-edit-hour-field,
        input[type="time"]:valid::-webkit-datetime-edit-minute-field {
          color: #333333;
          text-transform: uppercase;
        }
        input[type="date"]::-webkit-datetime-edit-text,
        input[type="time"]::-webkit-datetime-edit-text {
          color: #666666 !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          margin-right: 8px;
          margin-left: -4px;
          cursor: pointer;
        }
        input[type="date"]::-webkit-datetime-edit,
        input[type="time"]::-webkit-datetime-edit {
          cursor: pointer;
          pointer-events: auto;
        }
        input[type="date"]::-webkit-datetime-edit-fields-wrapper,
        input[type="time"]::-webkit-datetime-edit-fields-wrapper {
          cursor: pointer;
          pointer-events: auto;
        }
        input[type="date"]::-webkit-datetime-edit-text,
        input[type="date"]::-webkit-datetime-edit-month-field,
        input[type="date"]::-webkit-datetime-edit-day-field,
        input[type="date"]::-webkit-datetime-edit-year-field,
        input[type="time"]::-webkit-datetime-edit-text,
        input[type="time"]::-webkit-datetime-edit-hour-field,
        input[type="time"]::-webkit-datetime-edit-minute-field {
          cursor: pointer;
          pointer-events: auto;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }, []);
  
  const handleClick = (event: any) => {
    // Ouvrir le sélecteur de date au clic
    if (event.target && typeof (event.target as any).showPicker === 'function') {
      try {
        const result = (event.target as any).showPicker();
        if (result && typeof result.catch === 'function') {
          result.catch(() => {
            // Fallback: focus sur l'input si showPicker échoue
            event.target.focus();
          });
        }
      } catch (error) {
        // Fallback: focus sur l'input si showPicker n'est pas disponible
        event.target.focus();
      }
    }
  };
  
  return React.createElement('input', {
    type: 'date',
    value: value || '',
    onChange: onChange,
    onClick: handleClick,
    min: min,
    style: style,
  });
};

// Composant pour le sélecteur d'heure web
const WebTimeInput = ({ value, onChange, style }: any) => {
  if (Platform.OS !== 'web') return null;
  
  const handleClick = (event: any) => {
    // Ouvrir le sélecteur d'heure au clic
    if (event.target && typeof (event.target as any).showPicker === 'function') {
      try {
        const result = (event.target as any).showPicker();
        if (result && typeof result.catch === 'function') {
          result.catch(() => {
            // Fallback: focus sur l'input si showPicker échoue
            event.target.focus();
          });
        }
      } catch (error) {
        // Fallback: focus sur l'input si showPicker n'est pas disponible
        event.target.focus();
      }
    }
  };
  
  return React.createElement('input', {
    type: 'time',
    value: value || '',
    onChange: onChange,
    onClick: handleClick,
    style: style,
  });
};

export default function CreateRequestScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<{ [key: string]: string }>({});
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculer la date minimale (demain) pour empêcher la sélection de la date du jour
  const getMinimumDate = (): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  // Charger les véhicules depuis la base de données
  useEffect(() => {
    const loadVehicles = async () => {
      if (!clientCompany) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Chargement des véhicules pour la demande...');
        const vehiclesData = await vehicleService.getByClientCompanyId(clientCompany.id);
        console.log('Véhicules chargés:', vehiclesData.length);
        setVehicles(vehiclesData);
      } catch (error: any) {
        console.error('Erreur lors du chargement des véhicules:', error);
        Alert.alert('Erreur', 'Impossible de charger les véhicules');
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicles();
  }, [clientCompany]);

  const toggleVehicle = (vehicleId: string) => {
    if (selectedVehicles.includes(vehicleId)) {
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId));
      const newServices = { ...selectedServices };
      delete newServices[vehicleId];
      setSelectedServices(newServices);
    } else {
      setSelectedVehicles([...selectedVehicles, vehicleId]);
    }
  };

  const setServiceForVehicle = (vehicleId: string, service: string) => {
    setSelectedServices({ ...selectedServices, [vehicleId]: service });
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    // Fermer le sélecteur d'heure si ouvert
    setShowTimePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const onWebDateChange = (event: any) => {
    const dateValue = event.target?.value;
    if (dateValue) {
      // Format attendu: YYYY-MM-DD
      const date = new Date(dateValue + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    }
  };

  const formatTime = (time: Date | null): string => {
    if (!time) return '';
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeForInput = (time: Date | null): string => {
    if (!time) return '';
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const onTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    // Fermer le sélecteur de date si ouvert
    setShowDatePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  const onWebTimeChange = (event: any) => {
    const timeValue = event.target?.value;
    if (timeValue) {
      // Format attendu: HH:MM
      const [hours, minutes] = timeValue.split(':');
      const time = new Date();
      time.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      setSelectedTime(time);
    }
  };

  const handleSubmit = async () => {
    if (!clientCompany) {
      Alert.alert('Erreur', 'Vous devez être connecté en tant qu\'entreprise cliente');
      return;
    }

    if (selectedVehicles.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un véhicule');
      return;
    }

    if (!address || !address.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner l\'adresse');
      return;
    }

    if (!selectedDate || !selectedTime) {
      Alert.alert('Erreur', 'Veuillez renseigner la date et l&apos;heure');
      return;
    }

    const missingServices = selectedVehicles.filter(id => !selectedServices[id]);
    if (missingServices.length > 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un service pour chaque véhicule');
      return;
    }

    setIsSubmitting(true);
    try {
      // Combiner la date et l'heure sélectionnées
      const dateTime = new Date(selectedDate);
      dateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

      if (isNaN(dateTime.getTime())) {
        Alert.alert('Erreur', 'Date ou heure invalide');
        setIsSubmitting(false);
        return;
      }

      // Vérifier que la date sélectionnée n'est pas aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateOnly = new Date(selectedDate);
      selectedDateOnly.setHours(0, 0, 0, 0);
      
      if (selectedDateOnly.getTime() <= today.getTime()) {
        Alert.alert('Erreur', 'Vous ne pouvez pas sélectionner la date du jour. Veuillez choisir une date future.');
        setIsSubmitting(false);
        return;
      }

      console.log('Création de la demande:', {
        address,
        dateTime: dateTime.toISOString(),
        notes,
        selectedVehicles,
        selectedServices,
      });

      // Préparer les véhicules avec leurs services
      const vehiclesData = selectedVehicles.map(vehicleId => ({
        vehicleId,
        serviceType: selectedServices[vehicleId] as 'exterior' | 'interior' | 'complete',
      }));

      // Créer la demande de lavage - concaténer adresse et ville
      const fullAddress = city.trim() 
        ? `${address.trim()}, ${city.trim()}`
        : address.trim();

      await washRequestService.create(
        {
          clientCompanyId: clientCompany.id,
          address: fullAddress,
          dateTime,
          status: 'pending',
          notes: notes.trim() || undefined,
          vehicles: [], // Les véhicules sont passés séparément
        },
        vehiclesData
      );

      console.log('✅ Demande créée avec succès');
      Alert.alert('Succès', 'Demande créée avec succès');
      // Redirection immédiate vers le dashboard
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de la demande:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la création de la demande');
    } finally {
      setIsSubmitting(false);
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des véhicules...</Text>
          </View>
        ) : vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun véhicule disponible</Text>
            <Text style={styles.emptySubtext}>
              Vous devez d&apos;abord ajouter des véhicules pour créer une demande
            </Text>
            <TouchableOpacity
              style={[buttonStyles.primary, styles.addVehicleButton]}
              onPress={() => router.push('/(client)/vehicles/add')}
            >
              <Text style={commonStyles.buttonText}>Ajouter un véhicule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Véhicules</Text>
            {vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <TouchableOpacity
              style={styles.vehicleHeader}
              onPress={() => toggleVehicle(vehicle.id)}
            >
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedVehicles.includes(vehicle.id) && styles.checkboxActive,
              ]}>
                {selectedVehicles.includes(vehicle.id) && (
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={16}
                    color="#FFFFFF"
                  />
                )}
              </View>
            </TouchableOpacity>
            {selectedVehicles.includes(vehicle.id) && (
              <View style={styles.servicesContainer}>
                <Text style={styles.serviceLabel}>Type de service :</Text>
                <View style={styles.serviceButtons}>
                  <TouchableOpacity
                    style={[
                      styles.serviceButton,
                      selectedServices[vehicle.id] === 'exterior' && styles.serviceButtonActive,
                    ]}
                    onPress={() => setServiceForVehicle(vehicle.id, 'exterior')}
                  >
                    <Text style={[
                      styles.serviceButtonText,
                      selectedServices[vehicle.id] === 'exterior' && styles.serviceButtonTextActive,
                    ]}>
                      Extérieur
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.serviceButton,
                      selectedServices[vehicle.id] === 'interior' && styles.serviceButtonActive,
                    ]}
                    onPress={() => setServiceForVehicle(vehicle.id, 'interior')}
                  >
                    <Text style={[
                      styles.serviceButtonText,
                      selectedServices[vehicle.id] === 'interior' && styles.serviceButtonTextActive,
                    ]}>
                      Intérieur
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.serviceButton,
                      selectedServices[vehicle.id] === 'complete' && styles.serviceButtonActive,
                    ]}
                    onPress={() => setServiceForVehicle(vehicle.id, 'complete')}
                  >
                    <Text style={[
                      styles.serviceButtonText,
                      selectedServices[vehicle.id] === 'complete' && styles.serviceButtonTextActive,
                    ]}>
                      Complet
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Lieu</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={commonStyles.input}
            placeholder="Adresse"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <Text style={styles.sectionTitle}>Ville</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={commonStyles.input}
            placeholder="Paris"
            placeholderTextColor={colors.textSecondary}
            value={city}
            onChangeText={setCity}
          />
        </View>

        <Text style={styles.sectionTitle}>Date et heure</Text>
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeInput}>
            {Platform.OS === 'web' ? (
              <WebDateInput
                value={formatDateForInput(selectedDate)}
                onChange={onWebDateChange}
                min={formatDateForInput(getMinimumDate())}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'solid',
                  borderRadius: 8,
                  paddingVertical: 20,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 12,
                  width: '100%',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  height: 56,
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setShowTimePicker(false);
                    setShowDatePicker(true);
                  }}
                  style={[commonStyles.input, styles.dateInputTouchable]}
                >
                  <Text style={[
                    styles.dateInputText,
                    !selectedDate && styles.dateInputPlaceholder
                  ]}>
                    {selectedDate ? formatDate(selectedDate) : 'JJ/MM/AAAA'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <Modal
                    visible={showDatePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {
                      setShowDatePicker(false);
                      setShowTimePicker(false);
                    }}
                  >
                    <View style={styles.pickerOverlay}>
                      <View style={styles.pickerContainer}>
                        <DateTimePicker
                          value={selectedDate || getMinimumDate()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={onDateChange}
                          minimumDate={getMinimumDate()}
                        />
                        {Platform.OS === 'ios' && (
                          <View style={styles.iosPickerActions}>
                            <TouchableOpacity
                              onPress={() => {
                                setShowDatePicker(false);
                                setShowTimePicker(false);
                              }}
                              style={styles.iosPickerButton}
                            >
                              <Text style={styles.iosPickerButtonText}>Valider</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </Modal>
                )}
              </>
            )}
          </View>
          <View style={styles.dateTimeInput}>
            {Platform.OS === 'web' ? (
              <WebTimeInput
                value={formatTimeForInput(selectedTime)}
                onChange={onWebTimeChange}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'solid',
                  borderRadius: 8,
                  paddingVertical: 20,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 12,
                  width: '100%',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  height: 56,
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowTimePicker(true);
                  }}
                  style={[commonStyles.input, styles.dateInputTouchable]}
                >
                  <Text style={[
                    styles.dateInputText,
                    !selectedTime && styles.dateInputPlaceholder
                  ]}>
                    {selectedTime ? formatTime(selectedTime) : 'HH:MM'}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <Modal
                    visible={showTimePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {
                      setShowTimePicker(false);
                      setShowDatePicker(false);
                    }}
                  >
                    <View style={styles.pickerOverlay}>
                      <View style={styles.pickerContainer}>
                        <DateTimePicker
                          value={selectedTime || new Date()}
                          mode="time"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={onTimeChange}
                        />
                        {Platform.OS === 'ios' && (
                          <View style={styles.iosPickerActions}>
                            <TouchableOpacity
                              onPress={() => {
                                setShowTimePicker(false);
                                setShowDatePicker(false);
                              }}
                              style={styles.iosPickerButton}
                            >
                              <Text style={styles.iosPickerButtonText}>Valider</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </Modal>
                )}
              </>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[commonStyles.input, styles.textArea]}
            placeholder="Instructions particulières..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

            <TouchableOpacity
              style={[buttonStyles.primary, styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || vehicles.length === 0}
            >
              <Text style={commonStyles.buttonText}>
                {isSubmitting ? 'Création en cours...' : 'Créer la demande'}
              </Text>
            </TouchableOpacity>
          </>
        )}
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
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  vehicleCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  vehicleName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  servicesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  serviceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  serviceButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  serviceButtonTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeInput: {
    flex: 1,
  },
  dateInputTouchable: {
    justifyContent: 'center',
    marginBottom: 0,
  },
  dateInputText: {
    fontSize: 16,
    color: colors.text,
  },
  dateInputPlaceholder: {
    color: colors.textSecondary,
  },
  dateInputWeb: {
    width: '100%',
    cursor: 'pointer',
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  iosPickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  iosPickerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitButton: {
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addVehicleButton: {
    marginTop: 16,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});
