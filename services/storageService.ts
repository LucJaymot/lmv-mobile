/**
 * Service de Stockage (Supabase Storage)
 * 
 * Gère l'upload et la récupération d'images et PDF depuis Supabase Storage
 */

import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';

const AVATAR_BUCKET = 'avatars';
const INVOICE_BUCKET = 'invoices';

/**
 * Demande les permissions nécessaires pour accéder à la galerie/caméra
 */
export async function requestImagePermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Sur web, pas de permissions nécessaires pour les fichiers
    return true;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }

  return true;
}

/**
 * Ouvre le sélecteur d'image (galerie ou caméra)
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerResult> {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) {
    throw new Error('Permission d\'accès à la galerie refusée');
  }

  return await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
}

/**
 * Upload une image vers Supabase Storage
 * @param fileUri URI locale du fichier (ex: file://... ou blob:...)
 * @param userId ID de l'utilisateur (pour organiser les fichiers)
 * @param fileName Nom du fichier (optionnel, généré automatiquement si non fourni)
 * @returns URL publique de l'image uploadée
 */
export async function uploadAvatar(
  fileUri: string,
  userId: string,
  fileName?: string
): Promise<string> {
  try {
    // Utiliser le userId passé en paramètre (qui vient du contexte d'authentification)
    // Sur mobile, getSession() peut retourner null même si l'utilisateur est connecté
    // Le client Supabase récupérera automatiquement la session depuis AsyncStorage
    const actualUserId = userId;
    console.log('📤 Upload avatar pour user ID:', actualUserId);

    // Générer un nom de fichier unique si non fourni
    const fileExtension = fileUri.split('.').pop()?.split('?')[0] || 'jpg';
    const timestamp = Date.now();
    const finalFileName = fileName || `${actualUserId}-${timestamp}.${fileExtension}`;
    const filePath = `${actualUserId}/${finalFileName}`;

    console.log('📤 Upload vers:', filePath);

    let fileBody: Blob | ArrayBuffer;
    let contentType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

    if (Platform.OS === 'web') {
      // Sur web, utiliser fetch pour récupérer le blob
      const response = await fetch(fileUri);
      fileBody = await response.blob();
    } else {
      // Sur mobile, utiliser FileSystem pour lire le fichier en base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });
      
      // Convertir base64 en ArrayBuffer
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      fileBody = byteArray.buffer;
    }

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, fileBody, {
        contentType,
        upsert: true, // Remplacer si le fichier existe déjà
      });

    if (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      console.error('❌ Détails:', JSON.stringify(error, null, 2));
      throw error;
    }

    // Récupérer l'URL publique de l'image
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Impossible de récupérer l\'URL publique de l\'image');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('❌ Erreur dans uploadAvatar:', error);
    throw error;
  }
}

/**
 * Supprime une image du storage
 */
export async function deleteAvatar(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Erreur dans deleteAvatar:', error);
    throw error;
  }
}

/**
 * Ouvre le sélecteur de document pour choisir un PDF
 */
export async function pickInvoice(): Promise<DocumentPicker.DocumentPickerResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    return result;
  } catch (error: any) {
    console.error('❌ Erreur lors de la sélection du document:', error);
    throw error;
  }
}

/**
 * Upload une facture PDF vers Supabase Storage
 * @param fileUri URI locale du fichier PDF
 * @param washRequestId ID de la demande de lavage (pour organiser les fichiers)
 * @param fileName Nom du fichier (optionnel, généré automatiquement si non fourni)
 * @returns URL publique de la facture uploadée
 */
export async function uploadInvoice(
  fileUri: string,
  washRequestId: string,
  fileName?: string
): Promise<string> {
  try {
    console.log('📤 Upload facture pour wash request ID:', washRequestId);

    // Vérifier que la session est bien chargée avant d'uploader
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Erreur lors de la récupération de la session:', sessionError);
      throw new Error('Session non disponible. Veuillez vous reconnecter.');
    }
    if (!session) {
      console.error('❌ Aucune session active');
      throw new Error('Session non disponible. Veuillez vous reconnecter.');
    }
    console.log('✅ Session active pour user:', session.user.id);

    // Générer un nom de fichier unique si non fourni
    const fileExtension = 'pdf';
    const timestamp = Date.now();
    const finalFileName = fileName || `invoice-${washRequestId}-${timestamp}.${fileExtension}`;
    const filePath = `${washRequestId}/${finalFileName}`;

    console.log('📤 Upload vers:', filePath);

    let fileBody: Blob | ArrayBuffer;
    const contentType = 'application/pdf';

    if (Platform.OS === 'web') {
      // Sur web, utiliser fetch pour récupérer le blob
      const response = await fetch(fileUri);
      fileBody = await response.blob();
    } else {
      // Sur mobile, utiliser FileSystem pour lire le fichier en base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });
      
      // Convertir base64 en ArrayBuffer
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      fileBody = byteArray.buffer;
    }

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(INVOICE_BUCKET)
      .upload(filePath, fileBody, {
        contentType,
        upsert: true, // Remplacer si le fichier existe déjà
      });

    if (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      console.error('❌ Détails:', JSON.stringify(error, null, 2));
      throw error;
    }

    // Récupérer l'URL publique de la facture
    const { data: urlData } = supabase.storage
      .from(INVOICE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Impossible de récupérer l\'URL publique de la facture');
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('❌ Erreur dans uploadInvoice:', error);
    throw error;
  }
}

/**
 * Supprime une facture du storage
 */
export async function deleteInvoice(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(INVOICE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('❌ Erreur dans deleteInvoice:', error);
    throw error;
  }
}

/**
 * Supprime toutes les factures d'une demande de lavage
 * @param washRequestId ID de la demande de lavage
 */
export async function deleteAllInvoicesForRequest(washRequestId: string): Promise<void> {
  try {
    console.log('🗑️ Suppression des factures existantes pour la demande:', washRequestId);
    
    // Lister tous les fichiers dans le dossier de la demande
    const { data: files, error: listError } = await supabase.storage
      .from(INVOICE_BUCKET)
      .list(washRequestId);

    if (listError) {
      console.error('❌ Erreur lors de la liste des fichiers:', listError);
      // Si le dossier n'existe pas, ce n'est pas une erreur
      if (listError.message?.includes('not found')) {
        return;
      }
      throw listError;
    }

    if (!files || files.length === 0) {
      console.log('✅ Aucune facture existante à supprimer');
      return;
    }

    // Construire les chemins complets des fichiers à supprimer
    const filePaths = files.map(file => `${washRequestId}/${file.name}`);
    
    console.log('🗑️ Suppression de', filePaths.length, 'fichier(s)');

    // Supprimer tous les fichiers
    const { error: deleteError } = await supabase.storage
      .from(INVOICE_BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression des fichiers:', deleteError);
      throw deleteError;
    }

    console.log('✅ Toutes les factures existantes ont été supprimées');
  } catch (error: any) {
    console.error('❌ Erreur dans deleteAllInvoicesForRequest:', error);
    throw error;
  }
}

