/**
 * Service d'envoi d'emails
 * 
 * Ce service gère l'envoi d'emails pour les notifications
 */

import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_STORAGE_KEY = '@lmv_notification_settings';

/**
 * Vérifie si les notifications email sont activées pour l'utilisateur actuel
 * @param userId ID de l'utilisateur (optionnel, si non fourni, récupère depuis la session)
 * @returns true si les emails sont activés, false sinon (par défaut true si non trouvé)
 */
async function isEmailNotificationEnabled(userId?: string): Promise<boolean> {
  try {
    // Si userId n'est pas fourni, récupérer depuis la session
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.log('⚠️ Aucune session active, on considère que les emails sont activés par défaut');
        return true; // Par défaut, on envoie les emails si on ne peut pas vérifier
      }
      targetUserId = session.user.id;
    }

    // Récupérer les préférences depuis AsyncStorage
    const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!stored) {
      console.log('📧 Aucune préférence trouvée, emails activés par défaut');
      return true; // Par défaut, on envoie les emails
    }

    const settings = JSON.parse(stored);
    const emailEnabled = settings.emailEnabled !== false; // true par défaut si non défini
    
    console.log(`📧 Préférences email pour l'utilisateur: ${emailEnabled ? 'activées' : 'désactivées'}`);
    return emailEnabled;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des préférences email:', error);
    // En cas d'erreur, on considère que les emails sont activés par défaut
    return true;
  }
}

/**
 * Helper pour appeler l'Edge Function send-email avec fetch
 * Cela permet de mieux contrôler les headers d'authentification
 * Vérifie automatiquement si l'email est destiné à l'utilisateur actuel et respecte ses préférences
 */
async function invokeSendEmailFunction(payload: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}, checkPreferences: boolean = true): Promise<{ data?: any; error?: any }> {
  // Vérifier les préférences si demandé
  if (checkPreferences) {
    try {
      // Vérifier si l'email est destiné à l'utilisateur actuel
      const { data: { session } } = await supabase.auth.getSession();
      const isCurrentUser = session?.user?.email === payload.to;
      
      if (isCurrentUser) {
        // Si c'est pour l'utilisateur actuel, vérifier ses préférences
        const emailEnabled = await isEmailNotificationEnabled();
        if (!emailEnabled) {
          console.log('📧 Emails désactivés par l\'utilisateur, envoi annulé');
          return {
            error: {
              code: 'EMAIL_DISABLED',
              message: 'Les notifications email sont désactivées par l\'utilisateur',
            },
          };
        }
      } else {
        // Si c'est pour un autre utilisateur, on ne peut pas vérifier ses préférences locales
        // On envoie toujours l'email car c'est une notification importante
        console.log('📧 Email destiné à un autre utilisateur, envoi autorisé (préférences non vérifiables)');
      }
    } catch (prefError) {
      console.warn('⚠️ Erreur lors de la vérification des préférences, on envoie l\'email quand même:', prefError);
      // En cas d'erreur, on envoie l'email pour ne pas bloquer les notifications importantes
    }
  }
  try {
    // Récupérer l'URL et la clé Supabase
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                        process.env.EXPO_PUBLIC_SUPABASE_URL || 
                        (supabase as any).supabaseUrl;
    const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                           process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                           (supabase as any).supabaseKey;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configuration Supabase manquante');
    }
    
    // Construire l'URL de l'Edge Function
    const functionUrl = `${supabaseUrl}/functions/v1/send-email`;
    
    // Récupérer la session pour le token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Préparer les headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    };
    
    // Ajouter le token d'authentification si disponible
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // Appeler l'Edge Function directement avec fetch
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      return {
        error: {
          code: response.status,
          message: data.error || `HTTP ${response.status}`,
          details: data,
        },
      };
    }
    
    return { data };
  } catch (error: any) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Erreur réseau',
      },
    };
  }
}

/**
 * Envoie un email au prestataire lorsqu'un nouveau job lui est assigné
 * @param providerEmail Email du prestataire
 * @param providerName Nom du prestataire
 * @param jobDetails Détails du job
 * @param checkPreferences Si true, vérifie les préférences de l'utilisateur actuel (défaut: false car c'est pour un autre utilisateur)
 */
export async function sendJobAssignmentEmail(
  providerEmail: string,
  providerName: string,
  jobDetails: {
    id: string;
    address: string;
    dateTime: Date;
    clientCompanyName?: string;
  },
  checkPreferences: boolean = false
): Promise<void> {
  try {
    console.log('📧 Envoi d\'email de notification de job au prestataire:', providerEmail);

    // Formater la date
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(jobDetails.dateTime);

    // Préparer le contenu de l'email
    const emailSubject = `Nouveau job assigné - ${jobDetails.address}`;
    const emailBody = `
Bonjour ${providerName},

Un nouveau job de lavage vous a été assigné !

Détails du job :
- Adresse : ${jobDetails.address}
- Date et heure : ${formattedDate}
${jobDetails.clientCompanyName ? `- Client : ${jobDetails.clientCompanyName}` : ''}

Vous pouvez consulter les détails du job dans votre application.

Cordialement,
L'équipe Lave ma voiture
    `.trim();

    // Pour l'instant, on utilise Supabase pour envoyer l'email
    // Note: Supabase n'a pas d'API native pour envoyer des emails personnalisés
    // Il faudra utiliser une Edge Function ou un service externe (Resend, SendGrid, etc.)
    // Pour l'instant, on log l'email qui devrait être envoyé
    
    console.log('📧 Email à envoyer:');
    console.log('To:', providerEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    // TODO: Implémenter l'envoi réel via Edge Function Supabase ou service externe
    // Pour l'instant, on utilise une Edge Function Supabase si elle existe
    // Sinon, on log juste pour le développement
    
    // Option 1: Utiliser une Edge Function Supabase (recommandé)
    try {
      const { data, error } = await invokeSendEmailFunction({
        to: providerEmail,
        subject: emailSubject,
        html: emailBody.replace(/\n/g, '<br>'),
        text: emailBody,
      }, checkPreferences);
      
      // Si l'email est désactivé, ne pas considérer cela comme une erreur
      if (error?.code === 'EMAIL_DISABLED') {
        console.log('📧 Email non envoyé car les notifications email sont désactivées');
        return;
      }

      if (error) {
        console.warn('⚠️ Erreur lors de l\'appel de l\'Edge Function:', error);
        console.warn('   Code:', error.code || 'N/A');
        console.warn('   Message:', error.message || 'N/A');
        if (error.code === 401) {
          console.warn('💡 Erreur 401: Désactivez "Verify JWT" dans Supabase Dashboard > Edge Functions > send-email');
        } else {
          console.log('💡 Vérifiez que l\'Edge Function est bien déployée et que les secrets sont configurés');
        }
      } else {
        console.log('✅ Email envoyé avec succès via Edge Function');
      }
    } catch (edgeFunctionError: any) {
      console.warn('⚠️ Edge Function non disponible:', edgeFunctionError.message);
      console.log('💡 Pour activer l\'envoi d\'emails, créez une Edge Function Supabase "send-email"');
    }

    // Option 2: Utiliser l'API Supabase Auth pour envoyer un email (limité)
    // Cette option nécessite que l'utilisateur soit dans auth.users
    // On peut utiliser resetPasswordForEmail comme template, mais ce n'est pas idéal
    
    console.log('✅ Fonction d\'envoi d\'email appelée (vérifiez les logs ci-dessus pour le statut)');
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    // Ne pas bloquer le processus si l'email échoue
    console.warn('⚠️ L\'email n\'a pas pu être envoyé, mais le job a été assigné avec succès');
  }
}

/**
 * Envoie un email au prestataire lorsqu'une prestation est annulée par le client
 * @param providerEmail Email du prestataire
 * @param providerName Nom du prestataire
 * @param jobDetails Détails du job
 * @param checkPreferences Si true, vérifie les préférences de l'utilisateur actuel (défaut: false car c'est pour un autre utilisateur)
 */
export async function sendJobCancellationEmail(
  providerEmail: string,
  providerName: string,
  jobDetails: {
    id: string;
    address: string;
    dateTime: Date;
    clientCompanyName?: string;
  },
  checkPreferences: boolean = false
): Promise<void> {
  try {
    console.log('📧 Envoi d\'email de notification d\'annulation au prestataire:', providerEmail);

    // Formater la date
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(jobDetails.dateTime);

    // Préparer le contenu de l'email
    const emailSubject = `Prestation annulée - ${jobDetails.address}`;
    const emailBody = `
Bonjour ${providerName},

Nous vous informons que la prestation suivante a été annulée par le client :

Détails de la prestation annulée :
- Adresse : ${jobDetails.address}
- Date et heure prévue : ${formattedDate}
${jobDetails.clientCompanyName ? `- Client : ${jobDetails.clientCompanyName}` : ''}

Cette prestation n'est plus à votre charge. Vous pouvez consulter vos autres prestations dans votre application.

Cordialement,
L'équipe Lave ma voiture
    `.trim();

    console.log('📧 Email d\'annulation à envoyer:');
    console.log('To:', providerEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    // Utiliser l'Edge Function Supabase pour envoyer l'email
    try {
      const { data, error } = await invokeSendEmailFunction({
        to: providerEmail,
        subject: emailSubject,
        html: emailBody.replace(/\n/g, '<br>'),
        text: emailBody,
      }, checkPreferences);

      if (error) {
        console.warn('⚠️ Erreur lors de l\'appel de l\'Edge Function:', error);
        console.warn('   Code:', error.code || 'N/A');
        console.warn('   Message:', error.message || 'N/A');
        if (error.code === 401) {
          console.warn('💡 Erreur 401: Désactivez "Verify JWT" dans Supabase Dashboard > Edge Functions > send-email');
        } else {
          console.log('💡 Vérifiez que l\'Edge Function est bien déployée et que les secrets sont configurés');
        }
      } else {
        console.log('✅ Email d\'annulation envoyé avec succès via Edge Function');
      }
    } catch (edgeFunctionError: any) {
      console.warn('⚠️ Edge Function non disponible:', edgeFunctionError.message);
      console.log('💡 Pour activer l\'envoi d\'emails, créez une Edge Function Supabase "send-email"');
    }

    console.log('✅ Fonction d\'envoi d\'email d\'annulation appelée (vérifiez les logs ci-dessus pour le statut)');
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email d\'annulation:', error);
    // Ne pas bloquer le processus si l'email échoue
    console.warn('⚠️ L\'email n\'a pas pu être envoyé, mais la prestation a été annulée avec succès');
  }
}

/**
 * Envoie un email au client lorsqu'un prestataire accepte sa demande
 * @param clientEmail Email du client
 * @param clientCompanyName Nom de l'entreprise cliente
 * @param jobDetails Détails du job
 * @param checkPreferences Si true, vérifie les préférences de l'utilisateur actuel (défaut: false car c'est pour un autre utilisateur)
 */
export async function sendJobAcceptedEmailToClient(
  clientEmail: string,
  clientCompanyName: string,
  jobDetails: {
    id: string;
    address: string;
    dateTime: Date;
    providerName: string;
    providerPhone?: string;
  },
  checkPreferences: boolean = false
): Promise<void> {
  try {
    console.log('📧 Envoi d\'email de notification d\'acceptation au client:', clientEmail);

    // Formater la date
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(jobDetails.dateTime);

    // Préparer le contenu de l'email
    const emailSubject = `Votre demande de lavage a été acceptée - ${jobDetails.address}`;
    const emailBody = `
Bonjour ${clientCompanyName},

Excellente nouvelle ! Votre demande de lavage a été acceptée par un prestataire.

Détails de la prestation :
- Adresse : ${jobDetails.address}
- Date et heure : ${formattedDate}
- Prestataire : ${jobDetails.providerName}
${jobDetails.providerPhone ? `- Téléphone : ${jobDetails.providerPhone}` : ''}

Votre prestataire se rendra à l'adresse indiquée à la date et heure prévues. Vous pouvez suivre l'avancement de votre demande dans votre application.

Cordialement,
L'équipe Lave ma voiture
    `.trim();

    console.log('📧 Email d\'acceptation à envoyer:');
    console.log('To:', clientEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    // Utiliser l'Edge Function Supabase pour envoyer l'email
    try {
        const { data, error } = await invokeSendEmailFunction({
          to: clientEmail,
          subject: emailSubject,
          html: emailBody.replace(/\n/g, '<br>'),
          text: emailBody,
        }, checkPreferences);
        
        // Si l'email est désactivé, ne pas considérer cela comme une erreur
        if (error?.code === 'EMAIL_DISABLED') {
          console.log('📧 Email d\'acceptation non envoyé car les notifications email sont désactivées par le client');
          return;
        }

      if (error) {
        console.warn('⚠️ Erreur lors de l\'appel de l\'Edge Function:', error);
        console.warn('   Code:', error.code || 'N/A');
        console.warn('   Message:', error.message || 'N/A');
        if (error.code === 401) {
          console.warn('💡 Erreur 401: Désactivez "Verify JWT" dans Supabase Dashboard > Edge Functions > send-email');
        } else {
          console.log('💡 Vérifiez que l\'Edge Function est bien déployée et que les secrets sont configurés');
        }
      } else {
        console.log('✅ Email d\'acceptation envoyé avec succès via Edge Function');
      }
    } catch (edgeFunctionError: any) {
      console.warn('⚠️ Edge Function non disponible:', edgeFunctionError.message);
      console.log('💡 Pour activer l\'envoi d\'emails, créez une Edge Function Supabase "send-email"');
    }

    console.log('✅ Fonction d\'envoi d\'email d\'acceptation appelée (vérifiez les logs ci-dessus pour le statut)');
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email d\'acceptation:', error);
    // Ne pas bloquer le processus si l'email échoue
    console.warn('⚠️ L\'email n\'a pas pu être envoyé, mais le job a été accepté avec succès');
  }
}

/**
 * Envoie un email à tous les prestataires lorsqu'une nouvelle demande est créée
 */
export async function sendNewRequestEmailToProviders(
  requestDetails: {
    id: string;
    address: string;
    dateTime: Date;
    clientCompanyName?: string;
    notes?: string;
  }
): Promise<void> {
  try {
    console.log('📧 Envoi d\'emails aux prestataires pour la nouvelle demande:', requestDetails.id);

    // Récupérer tous les prestataires
    // Essayer d'abord la requête directe
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 REQUÊTE POUR RÉCUPÉRER LES PRESTATAIRES');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Table: providers');
    console.log('📋 Colonnes: id, name, user_id');
    console.log('📋 Requête Supabase:');
    console.log('   supabase.from("providers").select("id, name, user_id")');
    console.log('📋 Requête SQL équivalente:');
    console.log('   SELECT id, name, user_id FROM providers;');
    console.log('═══════════════════════════════════════════════════════════');
    
    let providers: any[] | null = null;
    let providersError: any = null;

    const { data: providersData, error: directError } = await supabase
      .from('providers')
      .select('id, name, user_id');

    if (directError) {
      console.warn('⚠️ Erreur lors de la requête directe:', directError);
      console.warn('   Code:', directError.code);
      console.warn('   Message:', directError.message);
      console.log('🔄 Tentative via fonction SQL get_all_providers...');
      providersError = directError;

      // Fallback: utiliser la fonction SQL si disponible
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔄 FALLBACK: REQUÊTE VIA FONCTION SQL');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📋 Fonction: get_all_providers()');
      console.log('📋 Requête Supabase:');
      console.log('   supabase.rpc("get_all_providers")');
      console.log('📋 Requête SQL équivalente:');
      console.log('   SELECT * FROM get_all_providers();');
      console.log('═══════════════════════════════════════════════════════════');
      
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_providers');
        if (!rpcError && rpcData && rpcData.length > 0) {
          console.log(`✅ ${rpcData.length} prestataire(s) récupéré(s) via fonction SQL`);
          providers = rpcData;
        } else {
          console.warn('⚠️ Fonction get_all_providers non disponible ou aucun résultat:', rpcError);
          console.log('💡 Pour activer cette fonction, exécutez: database/get_all_providers_function.sql');
        }
      } catch (rpcError: any) {
        console.warn('⚠️ Impossible d\'appeler get_all_providers:', rpcError?.message || rpcError);
      }
    } else {
      providers = providersData;
    }

    console.log('📊 Résultat de la requête providers:');
    console.log('   Nombre de prestataires:', providers?.length || 0);
    if (providers && providers.length > 0) {
      console.log('   Données brutes:', JSON.stringify(providers, null, 2));
    }

    if (!providers || providers.length === 0) {
      console.log('⚠️ Aucun prestataire trouvé');
      console.log('💡 Actions à faire:');
      console.log('   1. Vérifiez qu\'il existe au moins un prestataire dans la table providers');
      console.log('   2. Vérifiez que la politique RLS "Providers are viewable by all" existe dans Supabase');
      console.log('   3. Exécutez le script SQL: database/get_all_providers_function.sql (contourne RLS)');
      console.log('   4. Vérifiez que la session Supabase est active');
      return;
    }

    console.log(`📋 ${providers.length} prestataire(s) trouvé(s)`);
    providers.forEach((p: any, index: number) => {
      console.log(`   ${index + 1}. ID: ${p.id}, Nom: ${p.name}, User ID: ${p.user_id}`);
    });

    // Récupérer les emails des prestataires depuis auth.users via la fonction SQL
    const userIds = providers.map((p: any) => p.user_id);
    let emailMap = new Map<string, string>();
    
    // Utiliser directement la fonction SQL pour récupérer depuis auth.users (méthode la plus fiable)
    console.log(`🔍 Récupération des emails pour ${userIds.length} prestataire(s) via fonction SQL...`);
    try {
      const { data: emailsData, error: rpcError } = await supabase.rpc('get_provider_emails', {
        provider_user_ids: userIds,
      });
      
      if (!rpcError && emailsData && emailsData.length > 0) {
        console.log(`✅ ${emailsData.length} email(s) récupéré(s) via fonction SQL depuis auth.users`);
        emailsData.forEach((item: any) => {
          if (item.user_id && item.email) {
            emailMap.set(item.user_id, item.email);
          }
        });
      } else {
        console.warn('⚠️ Fonction get_provider_emails non disponible ou aucun résultat:', rpcError);
        console.log('💡 Pour activer cette fonction, exécutez le script SQL dans Supabase:');
        console.log('   1. Allez dans Supabase Dashboard > SQL Editor');
        console.log('   2. Exécutez le contenu du fichier: database/get_provider_emails_function.sql');
        
        // Fallback: essayer depuis la table users si la fonction SQL n'existe pas
        console.log('🔄 Tentative de récupération depuis la table users en fallback...');
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        if (!usersError && users && users.length > 0) {
          console.log(`✅ ${users.length} email(s) trouvé(s) dans la table users (fallback)`);
          users.forEach((u: any) => {
            emailMap.set(u.id, u.email);
          });
        } else {
          console.warn('⚠️ Aucun email trouvé dans la table users non plus:', usersError);
        }
      }
    } catch (rpcError: any) {
      console.warn('⚠️ Impossible d\'appeler la fonction get_provider_emails:', rpcError?.message || rpcError);
      console.log('💡 Pour activer cette fonction, exécutez le script SQL dans Supabase:');
      console.log('   1. Allez dans Supabase Dashboard > SQL Editor');
      console.log('   2. Exécutez le contenu du fichier: database/get_provider_emails_function.sql');
      
      // Fallback: essayer depuis la table users
      console.log('🔄 Tentative de récupération depuis la table users en fallback...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      if (!usersError && users && users.length > 0) {
        console.log(`✅ ${users.length} email(s) trouvé(s) dans la table users (fallback)`);
        users.forEach((u: any) => {
          emailMap.set(u.id, u.email);
        });
      }
    }

    if (emailMap.size === 0) {
      console.log('⚠️ Aucun email trouvé pour les prestataires');
      console.log('💡 Actions à faire:');
      console.log('   1. Exécutez le script SQL: database/get_provider_emails_function.sql dans Supabase');
      console.log('   2. Vérifiez que les prestataires ont bien un email dans auth.users');
      console.log('   3. Vérifiez les logs ci-dessus pour plus de détails');
      return;
    }

    console.log(`✅ ${emailMap.size} email(s) trouvé(s) pour les prestataires`);

    // Formater la date
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(requestDetails.dateTime);

    // Préparer le contenu de l'email
    const emailSubject = `Nouvelle demande de lavage disponible - ${requestDetails.address}`;
    const emailBodyTemplate = (providerName: string) => `
Bonjour ${providerName},

Une nouvelle demande de lavage est disponible !

Détails de la demande :
- Adresse : ${requestDetails.address}
- Date et heure : ${formattedDate}
${requestDetails.clientCompanyName ? `- Client : ${requestDetails.clientCompanyName}` : ''}
${requestDetails.notes ? `- Notes : ${requestDetails.notes}` : ''}

Connectez-vous à votre application pour consulter les détails et accepter la demande si elle vous intéresse.

Cordialement,
L'équipe Lave ma voiture
    `.trim();

    // Envoyer un email à chaque prestataire
    const emailPromises = providers.map(async (provider) => {
      const providerEmail = emailMap.get(provider.user_id);
      if (!providerEmail) {
        console.warn(`⚠️ Email non trouvé pour le prestataire ${provider.name} (ID: ${provider.id})`);
        return;
      }

      const emailBody = emailBodyTemplate(provider.name);

      console.log(`📧 Envoi d'email à ${providerEmail} (${provider.name})`);

      // Utiliser l'Edge Function Supabase pour envoyer l'email
      // Ne pas vérifier les préférences car on envoie à plusieurs prestataires différents
      // (on ne peut pas vérifier les préférences locales des autres utilisateurs)
      try {
        const { data, error } = await invokeSendEmailFunction({
          to: providerEmail,
          subject: emailSubject,
          html: emailBody.replace(/\n/g, '<br>'),
          text: emailBody,
        }, false); // Ne pas vérifier les préférences pour les emails aux prestataires

        // Si l'email est désactivé, ne pas considérer cela comme une erreur
        if (error?.code === 'EMAIL_DISABLED') {
          console.log(`📧 Email non envoyé à ${providerEmail} car les notifications email sont désactivées`);
          return;
        }

        if (error) {
          throw error;
        }
        
        console.log(`✅ Email envoyé avec succès à ${providerEmail}`);
      } catch (edgeFunctionError: any) {
        console.error(`❌ Erreur lors de l'envoi de l'email à ${providerEmail}:`, edgeFunctionError);
        console.error(`   Code: ${edgeFunctionError.code || 'N/A'}`);
        console.error(`   Message: ${edgeFunctionError.message || 'N/A'}`);
        
        // Afficher les détails de l'erreur si disponibles
        if (edgeFunctionError.details) {
          console.error(`   Détails:`, edgeFunctionError.details);
        }
        
        // Si erreur 401, c'est un problème d'authentification
        if (edgeFunctionError.code === 401) {
          console.error('═══════════════════════════════════════════════════════════');
          console.error('🔐 Erreur d\'authentification (401)');
          console.error('═══════════════════════════════════════════════════════════');
          console.error('💡 Solutions possibles:');
          console.error('   1. Désactivez "Verify JWT" dans Supabase Dashboard > Edge Functions > send-email');
          console.error('   2. Ou redéployez la fonction avec verify_jwt = false dans config.toml');
          console.error('   3. Vérifiez que la session est bien active');
          console.error('═══════════════════════════════════════════════════════════');
        }
        
        // Si erreur 502, c'est un problème avec Resend
        if (edgeFunctionError.code === 502) {
          console.error('═══════════════════════════════════════════════════════════');
          console.error('📧 Erreur Resend (502)');
          console.error('═══════════════════════════════════════════════════════════');
          console.error('💡 Causes possibles:');
          console.error('   1. La clé API Resend n\'est pas valide ou n\'est pas configurée');
          console.error('   2. L\'adresse email expéditeur n\'est pas vérifiée dans Resend');
          console.error('   3. Le domaine n\'est pas vérifié dans Resend');
          console.error('');
          console.error('💡 Solutions:');
          console.error('   1. Vérifiez que RESEND_API_KEY est bien configuré dans Supabase Secrets');
          console.error('   2. Utilisez "onboarding@resend.dev" comme expéditeur pour les tests');
          console.error('   3. Vérifiez votre compte Resend: https://resend.com/emails');
          if (edgeFunctionError.details) {
            console.error('');
            console.error('📋 Détails de l\'erreur Resend:');
            console.error(JSON.stringify(edgeFunctionError.details, null, 2));
          }
          console.error('═══════════════════════════════════════════════════════════');
        }
      }
    });

    // Attendre que tous les emails soient envoyés (ou échouent)
    await Promise.allSettled(emailPromises);

    console.log('✅ Processus d\'envoi d\'emails aux prestataires terminé');
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi des emails aux prestataires:', error);
    // Ne pas bloquer le processus si l'email échoue
    console.warn('⚠️ Les emails n\'ont pas pu être envoyés, mais la demande a été créée avec succès');
  }
}

/**
 * Fonction de test pour vérifier que l'Edge Function send-email fonctionne
 * 
 * Usage:
 *   import { testEmailFunction } from '@/services/emailService';
 *   await testEmailFunction('votre-email@example.com');
 */
export async function testEmailFunction(testEmail: string): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TEST D\'ENVOI D\'EMAIL VIA EDGE FUNCTION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📧 Email destinataire: ${testEmail}`);
  console.log('');

  const emailSubject = 'Test email - Lave ma voiture';
  const emailBody = `
Bonjour,

Ceci est un email de test pour vérifier que l'Edge Function send-email fonctionne correctement.

Si vous recevez cet email, cela signifie que :
✅ L'Edge Function est bien déployée
✅ Resend est correctement configuré
✅ Les secrets Supabase sont bien définis

Cordialement,
L'équipe Lave ma voiture
  `.trim();

  try {
    console.log('📤 Envoi de la requête à l\'Edge Function...');
    
    const { data, error } = await invokeSendEmailFunction({
      to: testEmail,
      subject: emailSubject,
      html: emailBody.replace(/\n/g, '<br>'),
      text: emailBody,
    }, true); // Vérifier les préférences pour les tests
    
    // Si l'email est désactivé, informer l'utilisateur
    if (error?.code === 'EMAIL_DISABLED') {
      console.error('❌ Email non envoyé car les notifications email sont désactivées');
      console.error('💡 Activez les notifications email dans les paramètres pour recevoir des emails');
      throw error;
    }

    if (error) {
      console.error('❌ Erreur lors de l\'appel de l\'Edge Function:');
      console.error('   Code:', error.code || 'N/A');
      console.error('   Message:', error.message || 'N/A');
      console.error('   Détails:', JSON.stringify(error, null, 2));
      console.error('');
      console.error('💡 Vérifications à faire:');
      console.error('   1. L\'Edge Function est-elle déployée ? (Supabase Dashboard > Edge Functions)');
      console.error('   2. Les secrets sont-ils configurés ? (RESEND_API_KEY, EMAIL_FROM)');
      console.error('   3. Votre clé API Resend est-elle valide ?');
      throw error;
    }

    if (data) {
      console.log('✅ Réponse de l\'Edge Function:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      console.log('✅ Email envoyé avec succès !');
      console.log(`📧 Vérifiez votre boîte email: ${testEmail}`);
      console.log('   (Vérifiez aussi le dossier spam si nécessaire)');
    } else {
      console.warn('⚠️ Aucune donnée retournée par l\'Edge Function');
      console.warn('   Mais l\'appel a réussi, l\'email devrait être envoyé');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TEST TERMINÉ');
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error: any) {
    console.error('❌ Erreur lors du test:');
    console.error('   Type:', error.constructor?.name || 'Unknown');
    console.error('   Message:', error.message || 'N/A');
    console.error('   Stack:', error.stack || 'N/A');
    console.error('');
    console.error('💡 Vérifications à faire:');
    console.error('   1. L\'Edge Function est-elle déployée ?');
    console.error('   2. Êtes-vous connecté à Supabase ? (vérifiez votre configuration)');
    console.error('   3. Vérifiez les logs ci-dessus pour plus de détails');
    throw error;
  }
}

