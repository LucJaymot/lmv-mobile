
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/hooks';
import { Vehicle } from '@/types';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { vehicleService } from '@/services/databaseService';

export default function VehiclesScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
  const { theme } = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const loadVehicles = async () => {
    if (!clientCompany) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Chargement des véhicules pour:', clientCompany.id);
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

  // Charger les véhicules au montage du composant
  useEffect(() => {
    loadVehicles();
  }, [clientCompany]);

  // Recharger les véhicules quand on revient sur la page
  useFocusEffect(
    React.useCallback(() => {
      loadVehicles();
    }, [clientCompany])
  );

  const handleDeleteVehicle = (vehicleId: string) => {
    console.log('🟢 handleDeleteVehicle appelé pour:', vehicleId);
    
    const performDelete = async () => {
      try {
        console.log('Appel de vehicleService.delete...');
        await vehicleService.delete(vehicleId);
        console.log('✅ Véhicule supprimé avec succès:', vehicleId);
        // Recharger la liste
        console.log('Rechargement de la liste des véhicules...');
        await loadVehicles();
        console.log('Affichage de l\'alerte de succès...');
        Alert.alert('Succès', 'Véhicule supprimé avec succès');
      } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);
        console.error('Type:', error?.constructor?.name);
        console.error('Code:', error?.code);
        console.error('Message:', error?.message);
        console.error('Details:', error?.details);
        console.error('Stack:', error?.stack);
        Alert.alert('Erreur', error.message || 'Impossible de supprimer le véhicule');
      }
    };

    // Utiliser window.confirm pour le web, Alert.alert pour mobile
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?');
      if (!confirmed) {
        console.log('❌ Suppression annulée par l\'utilisateur');
        return;
      }
      console.log('🟡 Confirmation de suppression pour:', vehicleId);
      performDelete();
    } else {
      // Pour mobile, utiliser Alert.alert
      Alert.alert(
        'Supprimer le véhicule',
        'Êtes-vous sûr de vouloir supprimer ce véhicule ?',
        [
          { 
            text: 'Annuler', 
            style: 'cancel',
            onPress: () => console.log('❌ Suppression annulée par l\'utilisateur')
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              console.log('🟡 Confirmation de suppression pour:', vehicleId);
              performDelete();
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Mes véhicules</Text>
        <Button
          variant="ghost"
          size="md"
          onPress={() => router.push('/(client)/vehicles/add')}
          style={{
            ...styles.addButton,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={22}
            color={theme.colors.accent}
          />
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement des véhicules...</Text>
          </View>
        ) : vehicles.length > 0 ? (
          <React.Fragment>
            {vehicles.map((vehicle) => (
              <View key={vehicle.id} style={[commonStyles.card, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.vehicleHeader}>
                  {vehicle.imageUrl && !imageErrors.has(vehicle.id) ? (
                    <Image
                      source={{ uri: vehicle.imageUrl }}
                      style={[styles.vehicleImage, { backgroundColor: theme.colors.elevated }]}
                      resizeMode="contain"
                      onError={() => {
                        console.warn('⚠️ Erreur lors du chargement de l\'image pour le véhicule:', vehicle.id);
                        setImageErrors(prev => new Set(prev).add(vehicle.id));
                      }}
                    />
                  ) : (
                  <View style={[styles.vehicleIcon, { backgroundColor: theme.colors.elevated }]}>
                    <IconSymbol
                      ios_icon_name="car.fill"
                      android_material_icon_name="directions-car"
                      size={32}
                      color={theme.colors.accent}
                    />
                  </View>
                  )}
                  <View style={styles.vehicleInfo}>
                    <Text style={[styles.vehiclePlate, { color: theme.colors.text }]}>{vehicle.licensePlate}</Text>
                    <Text style={[styles.vehicleName, { color: theme.colors.text }]}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                    <Text style={[styles.vehicleType, { color: theme.colors.textMuted }]}>{vehicle.type}</Text>
                  </View>
                </View>
                <View style={[styles.vehicleActions, { borderTopColor: theme.colors.border }]}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/(client)/vehicles/edit?id=${vehicle.id}`)}
                  >
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={20}
                      color={theme.colors.accent}
                    />
                    <Text style={[styles.actionButtonText, { color: theme.colors.accent }]}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      console.log('🟢 Bouton Supprimer cliqué pour:', vehicle.id);
                      handleDeleteVehicle(vehicle.id);
                    }}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20}
                      color={theme.colors.error}
                    />
                    <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </React.Fragment>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="car"
              android_material_icon_name="directions-car"
              size={64}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>Aucun véhicule enregistré</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textMuted }]}>
              Ajoutez vos véhicules pour créer des demandes de lavage
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 48,
    height: 48,
    minWidth: 48,
    borderRadius: 24,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  vehicleHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    padding: 8,
  },
  vehicleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 14,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
