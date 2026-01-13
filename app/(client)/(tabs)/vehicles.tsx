
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
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Vehicle } from '@/types';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { vehicleService } from '@/services/databaseService';

export default function VehiclesScreen() {
  const router = useRouter();
  const { clientCompany } = useAuth();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes véhicules</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(client)/vehicles/add')}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Chargement des véhicules...</Text>
          </View>
        ) : vehicles.length > 0 ? (
          <React.Fragment>
            {vehicles.map((vehicle) => (
              <View key={vehicle.id} style={commonStyles.card}>
                <View style={styles.vehicleHeader}>
                  {vehicle.imageUrl && !imageErrors.has(vehicle.id) ? (
                    <Image
                      source={{ uri: vehicle.imageUrl }}
                      style={styles.vehicleImage}
                      resizeMode="contain"
                      onError={() => {
                        console.warn('⚠️ Erreur lors du chargement de l\'image pour le véhicule:', vehicle.id);
                        setImageErrors(prev => new Set(prev).add(vehicle.id));
                      }}
                    />
                  ) : (
                  <View style={styles.vehicleIcon}>
                    <IconSymbol
                      ios_icon_name="car.fill"
                      android_material_icon_name="directions-car"
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  )}
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                    <Text style={styles.vehicleName}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                    <Text style={styles.vehicleType}>{vehicle.type}</Text>
                  </View>
                </View>
                <View style={styles.vehicleActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/(client)/vehicles/edit?id=${vehicle.id}`)}
                  >
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.actionButtonText}>Modifier</Text>
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
                      color={colors.error}
                    />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>
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
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>Aucun véhicule enregistré</Text>
            <Text style={styles.emptySubtext}>
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
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vehicleImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: colors.background,
    padding: 8,
  },
  vehicleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
});
