
import React, { useState, useEffect, useRef } from 'react';
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
  const [userMessage, setUserMessage] = useState<{ title: string; body: string } | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Injecter les animations CSS pour web uniquement
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'vehicles-animations';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        [data-vehicles-header] {
          animation: fadeInUp 0.6s ease-out;
        }
        
        [data-vehicles-card] {
          animation: fadeInUp 0.5s ease-out both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        [data-vehicles-card]:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        
        [data-vehicles-empty-state] {
          animation: fadeIn 0.6s ease-out 0.4s both;
        }
        
        [data-vehicles-loading] {
          animation: fadeIn 0.3s ease-out;
        }
        
        [data-vehicles-message] {
          animation: fadeInUp 0.4s ease-out;
        }
      `;
      
      setIsMounted(true);
      
      return () => {
        // Ne pas supprimer le style car il peut être réutilisé
      };
    } else {
      setIsMounted(true);
    }
  }, []);

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
      lastLoadTimeRef.current = Date.now();
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
    
    // Nettoyer le timeout lors du démontage
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, [clientCompany]);

  // Recharger les véhicules quand on revient sur la page (avec cache de 30s)
  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      // Ne recharger que si les données ont plus de 30 secondes
      if (now - lastLoadTimeRef.current > 30000) {
        loadVehicles();
      }
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
        const msg = (error?.message || '').toLowerCase();
        if (msg.includes('associé') || msg.includes('associe')) {
          const title = 'Suppression impossible';
          const body =
            "Ce véhicule est associé à une prestation. Supprimez/annulez d'abord la prestation liée, puis réessayez.";

          // Bannière in-app (fiable sur web et mobile)
          setUserMessage({ title, body });
          // Nettoyer le timeout précédent s'il existe
          if (messageTimeoutRef.current) {
            clearTimeout(messageTimeoutRef.current);
          }
          // Auto-hide après 6s
          messageTimeoutRef.current = setTimeout(() => {
            setUserMessage(null);
            messageTimeoutRef.current = null;
          }, 6000);

          // Alert en plus (utile sur mobile)
          if (Platform.OS !== 'web') {
            Alert.alert(title, body);
          }
          return;
        }
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
      <View 
        style={styles.header}
        {...(Platform.OS === 'web' ? { 'data-vehicles-header': true } : {})}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Mes véhicules</Text>
        <Button
          variant="ghost"
          size="md"
          onPress={() => router.push('/(client)/vehicles/add')}
          style={{
            ...styles.addButton,
            backgroundColor: theme.colors.elevated,
            borderColor: theme.colors.border,
            borderWidth: 1.5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={22}
            color={theme.colors.text}
          />
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {userMessage && (
          <View 
            style={[styles.messageBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            {...(Platform.OS === 'web' ? { 'data-vehicles-message': true } : {})}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.messageTitle, { color: theme.colors.text }]}>{userMessage.title}</Text>
              <Text style={[styles.messageBody, { color: theme.colors.textMuted }]}>{userMessage.body}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setUserMessage(null)}
              accessibilityRole="button"
              style={styles.messageClose}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={18}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        )}
        {isLoading ? (
          <View 
            style={styles.loadingContainer}
            {...(Platform.OS === 'web' ? { 'data-vehicles-loading': true } : {})}
          >
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement des véhicules...</Text>
          </View>
        ) : vehicles.length > 0 ? (
          <React.Fragment>
            {vehicles.map((vehicle, index) => (
              <View 
                key={vehicle.id} 
                style={[
                  commonStyles.card, 
                  { backgroundColor: theme.colors.surface },
                  Platform.OS === 'web' && styles.webCard,
                  Platform.OS === 'web' && {
                    animationDelay: `${0.2 + index * 0.1}s`,
                  } as any,
                ]}
                {...(Platform.OS === 'web' ? { 'data-vehicles-card': true } : {})}
              >
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
                      color={theme.colors.text}
                    />
                    <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Modifier</Text>
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
          <View 
            style={styles.emptyState}
            {...(Platform.OS === 'web' ? { 'data-vehicles-empty-state': true } : {})}
          >
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
  messageBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageClose: {
    padding: 4,
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
  webCard: {
    // Styles supplémentaires pour web uniquement
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
    } : {}),
  },
});
