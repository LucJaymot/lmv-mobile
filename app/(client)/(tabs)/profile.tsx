
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContextSupabase';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useTheme } from '@/theme/hooks';
import { IconSymbol } from '@/components/IconSymbol';
import { pickImage, uploadAvatar } from '@/services/storageService';
import { supabase } from '@/lib/supabase';
import { useWebAnimations } from '@/hooks/useWebAnimations';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { user, clientCompany, logout, updateProfile } = useAuth();
  const { theme, mode, setMode } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null);
  const { getDataAttribute } = useWebAnimations('profile');

  const isNetworkError = (e: unknown) =>
    e instanceof TypeError && e.message === 'Network request failed';
  
  // Debug: Afficher les données du clientCompany
  useEffect(() => {
    console.log('🔍 ===== DEBUG CLIENT COMPANY =====');
    console.log('🔍 clientCompany complet:', JSON.stringify(clientCompany, null, 2));
    console.log('🔍 clientCompany existe?', !!clientCompany);
    console.log('🔍 avatarUrl:', clientCompany?.avatarUrl);
    console.log('🔍 avatarUrl est défini?', clientCompany?.avatarUrl !== undefined);
    console.log('🔍 avatarUrl est null?', clientCompany?.avatarUrl === null);
    console.log('🔍 avatarUrl est vide?', clientCompany?.avatarUrl === '');
    console.log('🔍 Type avatarUrl:', typeof clientCompany?.avatarUrl);
    if (clientCompany?.avatarUrl) {
      console.log('🔍 Longueur avatarUrl:', clientCompany.avatarUrl.length);
      console.log('🔍 Premiers caractères:', clientCompany.avatarUrl.substring(0, 50));
      console.log('🔍 Derniers caractères:', clientCompany.avatarUrl.substring(Math.max(0, clientCompany.avatarUrl.length - 50)));
      console.log('🔍 Commence par http?', clientCompany.avatarUrl.startsWith('http'));
      console.log('🔍 Contient "supabase"?', clientCompany.avatarUrl.includes('supabase'));
    }
    console.log('🔍 user:', user);
    console.log('🔍 ===============================');
  }, [clientCompany, user]);
  
  // Fonction pour obtenir l'URL de l'avatar (régénère si nécessaire)
  const getAvatarUrl = async (avatarUrl: string | undefined): Promise<string | null> => {
    console.log('🔧 ===== getAvatarUrl APPELÉ =====');
    console.log('🔧 Paramètre avatarUrl:', avatarUrl);
    console.log('🔧 Type:', typeof avatarUrl);
    console.log('🔧 Est undefined?', avatarUrl === undefined);
    console.log('🔧 Est null?', avatarUrl === null);
    console.log('🔧 Est vide?', avatarUrl === '');
    
    if (!avatarUrl) {
      console.log('❌ getAvatarUrl: avatarUrl est undefined, null ou vide');
      console.log('🔧 ===============================');
      return null;
    }
    
    console.log('🔧 avatarUrl valide, longueur:', avatarUrl.length);
    console.log('🔧 Contenu complet:', avatarUrl);
    
    // Nettoyer l'URL si elle contient une URL blob locale concaténée
    // Format problématique: ...blob:http://localhost:8081/...
    let cleanedUrl = avatarUrl;
    let needsCleaning = cleanedUrl.includes('.blob:http://') || cleanedUrl.includes('.blob:https://');
    
    if (needsCleaning) {
      console.log('🧹 Nettoyage de l\'URL - détection de blob local');
      
      // Extraire le userId depuis l'URL
      const userIdMatch = cleanedUrl.match(/\/avatars\/([^\/]+)\//);
      if (userIdMatch && userIdMatch[1]) {
        const userId = userIdMatch[1];
        console.log('🧹 userId extrait:', userId);
        
        // Essayer de trouver le fichier réel en listant les fichiers dans le dossier
        try {
          const { data: files, error: listError } = await supabase.storage
            .from('avatars')
            .list(userId);
          
          if (!listError && files && files.length > 0) {
            console.log('📁 Fichiers trouvés dans le dossier:', files.map(f => f.name));
            
            // Trier les fichiers par date de modification (le plus récent en premier)
            // et filtrer pour ne garder que ceux qui ont une extension d'image valide
            const imageFiles = files
              .filter(file => {
                // Vérifier si le fichier a une extension d'image valide
                // Même si le nom contient .blob, on peut quand même l'utiliser
                const hasImageExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
                return hasImageExt;
              })
              .sort((a, b) => {
                // Trier par date de modification (le plus récent en premier)
                const dateA = a.updated_at || a.created_at || '';
                const dateB = b.updated_at || b.created_at || '';
                return dateB.localeCompare(dateA);
              });
            
            if (imageFiles.length > 0) {
              // Utiliser le fichier le plus récent
              const mostRecentFile = imageFiles[0];
              const correctPath = `${userId}/${mostRecentFile.name}`;
              console.log('✅ Utilisation du fichier image le plus récent:', mostRecentFile.name);
              console.log('✅ Chemin complet:', correctPath);
              
              const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(correctPath);
              
              if (urlData?.publicUrl) {
                console.log('✅ URL publique générée:', urlData.publicUrl);
                cleanedUrl = urlData.publicUrl;
              } else {
                console.error('❌ Impossible de générer l\'URL publique pour:', correctPath);
              }
            } else {
              console.warn('⚠️ Aucun fichier image trouvé dans le dossier');
            }
          } else if (listError) {
            console.error('❌ Erreur lors de la liste des fichiers:', listError);
          }
        } catch (listError) {
          if (isNetworkError(listError)) return null;
          console.warn('⚠️ Exception lors de la liste des fichiers:', listError);
        }
      }
    }
    
    // Si l'URL est déjà une URL complète (commence par http), l'utiliser telle quelle
    // MAIS seulement si elle ne contient pas de blob local
    if ((cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) && 
        !cleanedUrl.includes('.blob:http://') && !cleanedUrl.includes('.blob:https://')) {
      console.log('✅ URL complète et valide détectée, utilisation directe');
      console.log('🔧 URL retournée:', cleanedUrl);
      console.log('🔧 ===============================');
      return cleanedUrl;
    }
    
    // Si l'URL contient encore du blob local après nettoyage, retourner null
    if (cleanedUrl.includes('.blob:http://') || cleanedUrl.includes('.blob:https://')) {
      console.error('❌ URL contient encore du blob local après nettoyage:', cleanedUrl);
      return null;
    }
    
    // Sinon, essayer de régénérer l'URL depuis le chemin
    // Le format devrait être: userId/filename.jpg
    console.log('🔄 Tentative de régénération de l\'URL depuis le chemin');
    console.log('🔄 Chemin fourni:', avatarUrl);
    console.log('🔄 Supabase client existe?', !!supabase);
    console.log('🔄 Supabase storage existe?', !!supabase.storage);
    
    try {
      const result = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarUrl);
      
      console.log('🔄 Résultat getPublicUrl:', result);
      console.log('🔄 result.data:', result.data);
      console.log('🔄 result.data?.publicUrl:', result.data?.publicUrl);
      
      if (result.data?.publicUrl) {
        console.log('✅ URL régénérée avec succès');
        console.log('✅ URL originale:', avatarUrl);
        console.log('✅ URL régénérée:', result.data.publicUrl);
        console.log('🔧 ===============================');
        return result.data.publicUrl;
      }
      
      // Si getPublicUrl ne retourne pas d'URL, retourner l'URL originale
      console.warn('⚠️ getPublicUrl n\'a pas retourné d\'URL');
      console.warn('⚠️ Retour de l\'URL originale:', avatarUrl);
      console.log('🔧 ===============================');
      return avatarUrl;
    } catch (error) {
      if (isNetworkError(error)) return null;
      console.error('❌ Exception lors de la génération de l\'URL');
      console.error('❌ Erreur:', error);
      console.error('❌ Type erreur:', typeof error);
      console.error('❌ Message:', (error as any)?.message);
      console.error('❌ Stack:', (error as any)?.stack);
      console.log('🔧 Retour de l\'URL originale:', avatarUrl);
      console.log('🔧 ===============================');
      return avatarUrl;
    }
  };
  
  // Réinitialiser l'erreur d'avatar et résoudre l'URL quand l'URL change
  useEffect(() => {
    if (clientCompany?.avatarUrl) {
      setAvatarError(false);
      getAvatarUrl(clientCompany.avatarUrl).then((finalUrl) => {
        console.log('🖼️ ===== DEBUG AVATAR =====');
        console.log('🖼️ Avatar URL depuis DB:', clientCompany.avatarUrl);
        console.log('🖼️ Type:', typeof clientCompany.avatarUrl);
        console.log('🖼️ Longueur:', clientCompany.avatarUrl?.length);
        console.log('🖼️ Avatar URL finale:', finalUrl);
        console.log('🖼️ ========================');
        setResolvedAvatarUrl(finalUrl);
      });
    } else {
      console.log('⚠️ Pas d\'avatarUrl dans clientCompany');
      console.log('⚠️ clientCompany:', clientCompany);
      setResolvedAvatarUrl(null);
    }
  }, [clientCompany?.avatarUrl]);
  
  // Basculer entre light et dark mode
  const isDarkMode = mode === 'dark' || mode === 'trueBlack';
  const handleThemeToggle = (value: boolean) => {
    setMode(value ? 'dark' : 'light');
  };

  const handleAvatarPress = async () => {
    try {
      const result = await pickImage();
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri || !user?.id || !clientCompany) {
        return;
      }

      setIsUploadingAvatar(true);
      
      // Upload l'image vers Supabase Storage
      const avatarUrl = await uploadAvatar(asset.uri, user.id);
      
      // Mettre à jour le profil avec la nouvelle URL
      await updateProfile({ avatarUrl });
      
      // Réinitialiser l'erreur d'avatar
      setAvatarError(false);
      
      Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour la photo de profil');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Empêcher les clics multiples
    
    console.log('handleLogout called');
    
    // Sur web, utiliser window.confirm
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      if (!confirmed) {
        return;
      }
      
      setIsLoggingOut(true);
      try {
        console.log('Logging out...');
        await logout();
        console.log('Logout successful, redirecting...');
        router.replace('/auth/login');
      } catch (error: any) {
        console.error('Erreur lors de la déconnexion:', error);
        alert(error.message || 'Impossible de se déconnecter');
        setIsLoggingOut(false);
      }
    } else {
      // Sur mobile, utiliser Alert.alert
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { 
            text: 'Annuler', 
            style: 'cancel',
            onPress: () => console.log('Logout cancelled')
          },
          {
            text: 'Déconnexion',
            style: 'destructive',
            onPress: async () => {
              setIsLoggingOut(true);
              try {
                console.log('Logging out...');
                await logout();
                console.log('Logout successful, redirecting...');
                // Le layout client redirigera automatiquement, mais on force aussi
                router.replace('/auth/login');
              } catch (error: any) {
                console.error('Erreur lors de la déconnexion:', error);
                Alert.alert('Erreur', error.message || 'Impossible de se déconnecter');
                setIsLoggingOut(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} {...getDataAttribute('header')}>
          <TouchableOpacity
            style={[styles.avatarContainer, { backgroundColor: theme.colors.surface }]}
            onPress={handleAvatarPress}
            disabled={isUploadingAvatar}
            activeOpacity={0.7}
          >
            {isUploadingAvatar ? (
              <ActivityIndicator size="large" color={theme.colors.accent} />
            ) : (() => {
              console.log('🎨 ===== RENDU AVATAR =====');
              console.log('🎨 clientCompany existe?', !!clientCompany);
              console.log('🎨 clientCompany?.avatarUrl:', clientCompany?.avatarUrl);
              console.log('🎨 avatarError:', avatarError);
              
              const avatarUrl = resolvedAvatarUrl;
              console.log('🎨 avatarUrl résolue:', avatarUrl);
              console.log('🎨 avatarUrl est truthy?', !!avatarUrl);
              console.log('🎨 Condition (avatarUrl && !avatarError):', !!(avatarUrl && !avatarError));
              
              if (avatarUrl && !avatarError) {
                console.log('🎨 Affichage de l\'image');
                console.log('🎨 URL utilisée:', avatarUrl);
                
                // Test de l'URL dans le navigateur (web uniquement)
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  console.log('🌐 ===== TEST URL ACCESSIBILITÉ =====');
                  console.log('🌐 URL à tester:', avatarUrl);
                  // Tester si l'URL est accessible
                  fetch(avatarUrl, { method: 'HEAD', mode: 'no-cors' })
                    .then((response) => {
                      console.log('🌐 Réponse fetch (mode no-cors):', response);
                    })
                    .catch((error) => {
                      console.error('🌐 Erreur fetch (mode no-cors):', error);
                    });
                  
                  // Test avec mode cors
                  fetch(avatarUrl, { method: 'HEAD' })
                    .then((response) => {
                      console.log('🌐 Réponse fetch (mode cors):', response);
                      console.log('🌐 Status:', response.status);
                      console.log('🌐 OK?', response.ok);
                      if (response.ok) {
                        console.log('✅ URL accessible (status:', response.status, ')');
                      } else {
                        console.error('❌ URL non accessible (status:', response.status, ')');
                        console.error('❌ Status text:', response.statusText);
                      }
                    })
                    .catch((error) => {
                      console.error('❌ Erreur lors du test de l\'URL:', error);
                      console.error('❌ Type erreur:', typeof error);
                      console.error('❌ Message:', error.message);
                    });
                  console.log('🌐 ====================================');
                }
                
                console.log('🎨 Création du composant Image');
                return (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    onError={(error) => {
                      console.error('❌ ===== ERREUR CHARGEMENT IMAGE =====');
                      console.error('❌ Erreur complète:', error);
                      console.error('❌ Erreur native:', error.nativeEvent);
                      console.error('❌ Erreur native error:', error.nativeEvent?.error);
                      console.error('❌ URL originale (DB):', clientCompany?.avatarUrl);
                      console.error('❌ URL finale utilisée:', avatarUrl);
                      console.error('❌ Type URL:', typeof avatarUrl);
                      console.error('❌ ====================================');
                      setAvatarError(true);
                    }}
                    onLoad={() => {
                      console.log('✅ ===== IMAGE CHARGÉE AVEC SUCCÈS =====');
                      console.log('✅ URL:', avatarUrl);
                      console.log('✅ ====================================');
                      setAvatarError(false);
                    }}
                    onLoadStart={() => {
                      console.log('🔄 Début du chargement de l\'image...');
                      console.log('🔄 URL:', avatarUrl);
                    }}
                    resizeMode="cover"
                  />
                );
              }
              
              console.log('🎨 Affichage de l\'icône par défaut');
              console.log('🎨 Raison: avatarUrl=', avatarUrl, 'avatarError=', avatarError);
              console.log('🎨 ===============================');
              return (
                <IconSymbol
                  ios_icon_name="building.2.fill"
                  android_material_icon_name="business"
                  size={48}
                  color={theme.colors.accent}
                />
              );
            })()}
            {!isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera-alt"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.companyName, { color: theme.colors.text }]}>{clientCompany?.name}</Text>
          <Text style={[styles.email, { color: theme.colors.textMuted }]}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]} {...getDataAttribute('section-title')}>
            Informations entreprise
          </Text>
          <View style={[commonStyles.card, { backgroundColor: theme.colors.surface }]} {...getDataAttribute('card')}>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Contact</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{clientCompany?.contact}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Téléphone</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{clientCompany?.phone}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{clientCompany?.email}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={theme.colors.textMuted}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Adresse</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{clientCompany?.address}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]} {...getDataAttribute('section-title')}>
            Actions
          </Text>
          <TouchableOpacity 
            style={[
              styles.actionItem, 
              { backgroundColor: theme.colors.surface },
              Platform.OS === 'web' && {
                animationDelay: '0.2s',
              } as any,
            ]} 
            onPress={() => router.push('/(client)/profile/edit')}
            {...getDataAttribute('item')}
          >
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={20}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Modifier le profil</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionItem, 
              { backgroundColor: theme.colors.surface },
              Platform.OS === 'web' && {
                animationDelay: '0.3s',
              } as any,
            ]}
            onPress={() => router.push('/(client)/profile/notifications')}
            {...getDataAttribute('item')}
          >
            <IconSymbol
              ios_icon_name="bell.fill"
              android_material_icon_name="notifications"
              size={20}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Notifications</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionItem, 
              { backgroundColor: theme.colors.surface },
              Platform.OS === 'web' && {
                animationDelay: '0.4s',
              } as any,
            ]}
            onPress={() => router.push('/(client)/(tabs)/invoices')}
            {...getDataAttribute('item')}
          >
            <IconSymbol
              ios_icon_name="doc.text.fill"
              android_material_icon_name="description"
              size={20}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Factures</Text>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          <View 
            style={[
              styles.actionItem, 
              { backgroundColor: theme.colors.surface },
              Platform.OS === 'web' && {
                animationDelay: '0.5s',
              } as any,
            ]}
            {...getDataAttribute('item')}
          >
            <IconSymbol
              ios_icon_name={isDarkMode ? "moon.fill" : "sun.max.fill"}
              android_material_icon_name={isDarkMode ? "dark-mode" : "light-mode"}
              size={20}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              {isDarkMode ? 'Dark mode' : 'Light mode'}
            </Text>
            <View style={styles.switchContainer}>
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ 
                  false: Platform.OS === 'ios' ? theme.colors.border : '#D1D5DB', 
                  true: theme.colors.accent 
                }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : '#FFFFFF'}
                ios_backgroundColor={Platform.OS === 'ios' ? theme.colors.border : undefined}
                style={styles.switch}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            buttonStyles.outline,
            styles.logoutButton,
            { borderColor: theme.colors.error },
            isLoggingOut && styles.buttonDisabled,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={theme.colors.error} />
          ) : (
            <Text style={[commonStyles.buttonTextOutline, { color: theme.colors.error }]}>Déconnexion</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'web' ? 100 : 180,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: Platform.OS === 'android' ? 50 : undefined,
    overflow: 'hidden',
  },
  switch: {
    ...(Platform.OS === 'android' && {
      transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
      marginRight: -8,
    }),
  },
});
