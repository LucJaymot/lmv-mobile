/**
 * AuthContext avec Supabase
 * 
 * Version moderne utilisant Supabase pour l'authentification et le stockage
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ClientCompany, Provider } from '@/types';
import { authService, userService } from '@/services/databaseService';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  clientCompany: ClientCompany | null;
  provider: Provider | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, profileData: any) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé pour stocker la session localement (fallback)
const SESSION_STORAGE_KEY = '@lmv_session';
const PROFILE_CACHE_KEY = '@lmv_profile_cache';
const PROFILE_CACHE_TIMESTAMP_KEY = '@lmv_profile_cache_timestamp';

// Durée de validité du cache (5 minutes)
const CACHE_DURATION_MS = 5 * 60 * 1000;

// Timeout adapté selon la plateforme (plus long sur web)
const PROFILE_LOAD_TIMEOUT_MS = Platform.OS === 'web' ? 30000 : 15000;

/** Détecte une erreur réseau (requête impossible depuis le device/simulateur) */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Network request failed') return true;
  if (error && typeof error === 'object' && 'message' in error && String((error as Error).message) === 'Network request failed') return true;
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clientCompany, setClientCompany] = useState<ClientCompany | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingProfileRef = React.useRef(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'with session' : 'no session');
      
      // Ignorer les événements qui ne nécessitent pas d'action
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        console.log('Event', event, '- no action needed');
        return;
      }
      
      // Empêcher les appels multiples simultanés
      if (isLoadingProfileRef.current) {
        console.log('⚠️ loadUserProfile déjà en cours, on ignore cet événement');
        return;
      }
      
      // Si pas de session, déconnecter (pour les événements comme SIGNED_OUT, etc.)
      if (!session) {
        console.log('No session found, clearing state');
        setUser(null);
        setClientCompany(null);
        setProvider(null);
        return;
      }
      
      // Si session existe et événement pertinent (SIGNED_IN, USER_UPDATED, etc.)
      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        try {
          isLoadingProfileRef.current = true;
          await loadUserProfile(session.user.id);
        } catch (error) {
          if (isNetworkError(error)) {
            console.warn('⚠️ Réseau indisponible - profil non chargé. Vérifiez la connexion.');
          } else {
            console.error('❌ Erreur lors du chargement du profil dans onAuthStateChange:', error);
          }
        } finally {
          isLoadingProfileRef.current = false;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      
      // Timeout de sécurité pour éviter que isLoading reste à true indéfiniment
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Timeout lors de la vérification de l\'authentification, on force isLoading à false');
        setIsLoading(false);
      }, 10000); // 10 secondes max
      
      try {
      const session = await authService.getSession();
      
      if (session?.user) {
        console.log('Found session for user:', session.user.email);
          
          // Empêcher les appels multiples simultanés
          if (!isLoadingProfileRef.current) {
            isLoadingProfileRef.current = true;
            try {
        await loadUserProfile(session.user.id);
            } catch (profileError) {
              console.error('❌ Erreur lors du chargement du profil:', profileError);
              // En cas d'erreur, on essaie le fallback local
              try {
                const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
                if (storedSession) {
                  const parsed = JSON.parse(storedSession);
                  if (parsed.user) {
                    setUser(parsed.user);
                    if (parsed.clientCompany) setClientCompany(parsed.clientCompany);
                    if (parsed.provider) setProvider(parsed.provider);
                  }
                }
              } catch (e) {
                console.error('Error parsing stored session:', e);
              }
            } finally {
              isLoadingProfileRef.current = false;
            }
          }
      } else {
        console.log('No active session found');
        // Tentative de récupération depuis le stockage local (fallback)
          try {
            const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
            if (storedSession) {
            const parsed = JSON.parse(storedSession);
            if (parsed.user) {
              setUser(parsed.user);
              if (parsed.clientCompany) setClientCompany(parsed.clientCompany);
              if (parsed.provider) setProvider(parsed.provider);
              }
            }
          } catch (e) {
            console.error('Error parsing stored session:', e);
          }
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('⚠️ Pas de connexion réseau. Vérifiez le Wi‑Fi ou les données mobiles (même réseau que le PC en dev).');
      } else {
        console.error('Error checking auth status:', error);
      }
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string, useCache: boolean = true) => {
    try {
      console.log('🔄 Chargement du profil pour user ID:', userId);
      
      // Vérifier le cache d'abord si demandé
      if (useCache) {
        try {
          const cachedTimestamp = await AsyncStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY);
          const cachedData = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
          
          if (cachedTimestamp && cachedData) {
            const timestamp = parseInt(cachedTimestamp, 10);
            const now = Date.now();
            
            // Si le cache est récent (moins de 5 minutes) et correspond au même userId
            if (now - timestamp < CACHE_DURATION_MS) {
              const parsed = JSON.parse(cachedData);
              if (parsed.userId === userId) {
                console.log('✅ Utilisation du cache pour le profil');
                setUser(parsed.user);
                if (parsed.clientCompany) setClientCompany(parsed.clientCompany);
                if (parsed.provider) setProvider(parsed.provider);
                
                // Charger en arrière-plan pour mettre à jour le cache
                loadUserProfile(userId, false).catch(err => {
                  console.warn('⚠️ Échec du rechargement en arrière-plan:', err);
                });
                return;
              }
            }
          }
        } catch (cacheError) {
          console.warn('⚠️ Erreur lors de la lecture du cache (non bloquant):', cacheError);
        }
      }
      
      // Charger depuis AsyncStorage comme fallback immédiat pendant le chargement réseau
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (parsed.user && parsed.user.id === userId) {
            console.log('📦 Utilisation du fallback AsyncStorage pendant le chargement');
            setUser(parsed.user);
            if (parsed.clientCompany) setClientCompany(parsed.clientCompany);
            if (parsed.provider) setProvider(parsed.provider);
          }
        }
      } catch (fallbackError) {
        console.warn('⚠️ Erreur lors du chargement du fallback (non bloquant):', fallbackError);
      }
      
      // Fonction de retry avec backoff exponentiel
      const retryWithBackoff = async <T,>(
        fn: () => Promise<T>,
        maxRetries: number = 2,
        baseDelay: number = 1000
      ): Promise<T> => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Timeout lors du chargement du profil')), PROFILE_LOAD_TIMEOUT_MS);
            });
            
            return await Promise.race([fn(), timeoutPromise]);
          } catch (error: any) {
            if (attempt === maxRetries) {
              throw error;
            }
            
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`⚠️ Tentative ${attempt + 1} échouée, nouvelle tentative dans ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        throw new Error('Toutes les tentatives ont échoué');
      };
      
      // Charger les données utilisateur avec retry
      const userData = await retryWithBackoff(() => userService.getUserById(userId));
      
      if (!userData) {
        console.log('⚠️ User not found in database');
        return;
      }

      console.log('✅ User loaded:', userData.email, 'Role:', userData.role);
      setUser(userData);

      // Charger le profil selon le rôle directement depuis les tables
      if (userData.role === 'client') {
        try {
          const { clientCompanyService } = await import('@/services/databaseService');
          const company = await retryWithBackoff(() => clientCompanyService.getByUserId(userId), 1, 500);
          
          if (company) {
            console.log('✅ Client company loaded:', company.name);
            setClientCompany(company);
            
            // Sauvegarder en local (fallback et cache)
            try {
              const sessionData = {
                user: userData,
                clientCompany: company,
                provider: null,
              };
              
              await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
              
              // Mettre à jour le cache avec timestamp
              await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
                userId,
                ...sessionData,
              }));
              await AsyncStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString());
            } catch (storageError) {
              console.warn('⚠️ Erreur lors de la sauvegarde dans AsyncStorage (non bloquant):', storageError);
            }
          } else {
            console.log('⚠️ No client company found for user');
          }
        } catch (companyError) {
          console.error('❌ Erreur lors du chargement de la client company:', companyError);
          // Ne pas bloquer, continuer sans la company
        }
      } else if (userData.role === 'provider') {
        try {
          const { providerService } = await import('@/services/databaseService');
          const providerData = await retryWithBackoff(() => providerService.getByUserId(userId), 1, 500);
          
          if (providerData) {
            console.log('✅ Provider loaded:', providerData.name);
            setProvider(providerData);
            
            // Sauvegarder en local (fallback et cache)
            try {
              const sessionData = {
                user: userData,
                clientCompany: null,
                provider: providerData,
              };
              
              await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
              
              // Mettre à jour le cache avec timestamp
              await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
                userId,
                ...sessionData,
              }));
              await AsyncStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString());
            } catch (storageError) {
              console.warn('⚠️ Erreur lors de la sauvegarde dans AsyncStorage (non bloquant):', storageError);
            }
          } else {
            console.log('⚠️ No provider found for user');
          }
        } catch (providerError) {
          console.error('❌ Erreur lors du chargement du provider:', providerError);
          // Ne pas bloquer, continuer sans le provider
        }
      }
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('⚠️ Réseau indisponible - profil non chargé.');
      } else {
        console.error('❌ Error loading user profile:', error);
      }
      
      // En cas d'erreur, essayer de charger depuis le cache/fallback
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (parsed.user && parsed.user.id === userId) {
            console.log('📦 Utilisation du fallback après erreur');
            setUser(parsed.user);
            if (parsed.clientCompany) setClientCompany(parsed.clientCompany);
            if (parsed.provider) setProvider(parsed.provider);
            return;
          }
        }
      } catch (fallbackError) {
        console.warn('⚠️ Impossible de charger depuis le fallback:', fallbackError);
      }
      
      // Ne pas relancer les erreurs réseau pour éviter l'affichage rouge
      if (!isNetworkError(error)) throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      
      const { user: authUser } = await authService.signIn(email, password);
      
      if (!authUser) {
        throw new Error('Échec de la connexion');
      }

      console.log('Login successful for:', authUser.email);
      console.log('User email_confirmed_at:', authUser.email_confirmed_at);
      
      // Charger le profil utilisateur
      await loadUserProfile(authUser.id);
      
      console.log('Login completed successfully');
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      
      // Gérer spécifiquement l'erreur de confirmation d'email
      // Supabase retourne cette erreur si l'email n'est pas confirmé
      if (error.message?.includes('Email not confirmed') || 
          error.message?.includes('email not confirmed') ||
          error.code === 'email_not_confirmed' ||
          error.status === 400) {
        // Vérifier le statut réel de l'utilisateur en cas de doute
        // Parfois l'utilisateur a confirmé mais Supabase n'a pas encore synchronisé
        try {
          const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser();
          if (!getUserError && currentUser && currentUser.email_confirmed_at) {
            console.log('✅ Email confirmé détecté après vérification, nouvelle tentative de connexion...');
            // L'email est confirmé, réessayer la connexion
            const { user: retryAuthUser } = await authService.signIn(email, password);
            if (retryAuthUser) {
              await loadUserProfile(retryAuthUser.id);
              console.log('Login réussi après vérification du statut');
              return;
            }
          }
        } catch (verifyError) {
          console.log('⚠️ Impossible de vérifier le statut de confirmation:', verifyError);
        }
        
        throw new Error('Votre email n\'a pas été confirmé. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation avant de vous connecter.');
      }
      
      throw new Error(error.message || 'Email ou mot de passe incorrect');
    }
  };

  const register = async (email: string, password: string, role: UserRole, profileData: any) => {
    try {
      console.log('=== DÉBUT INSCRIPTION ===');
      console.log('Email:', email);
      console.log('Role:', role);
      console.log('Profile data:', profileData);
      
      // Vérifier la connexion Supabase
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Session actuelle:', currentSession ? 'existe' : 'aucune');
      
      // Créer le compte avec Supabase Auth
      console.log('Tentative de création du compte avec Supabase Auth...');
      let authData;
      try {
        authData = await authService.signUp(email, password, role);
      } catch (authError: any) {
        console.error('❌ Erreur Supabase Auth:', authError);
        console.error('Code:', authError.status);
        console.error('Message:', authError.message);
        if (authError.message?.includes('already registered') || authError.message?.includes('already exists') || authError.message?.includes('already been registered')) {
          throw new Error('Un compte avec cet email existe déjà');
        }
        if (authError.message?.includes('invalid')) {
          throw new Error('Format d\'email invalide. L\'email existe peut-être déjà dans Supabase. Vérifiez dans Authentication > Users ou utilisez un autre email.');
        }
        throw new Error(authError.message || 'Erreur lors de la création du compte');
      }

      if (!authData || !authData.user) {
        console.error('❌ Aucun utilisateur retourné par Supabase Auth');
        console.error('authData:', authData);
        throw new Error('Échec de la création du compte - aucune donnée retournée');
      }

      console.log('✅ Compte Supabase Auth créé:', authData.user.email);
      console.log('User ID:', authData.user.id);

      // Le trigger PostgreSQL devrait créer automatiquement l'enregistrement dans users
      // Attendons un peu pour que le trigger s'exécute
      console.log('Attente de la création automatique par le trigger...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes pour le trigger
      
      // Ne pas essayer de vérifier ou créer manuellement - le trigger doit le faire
      // Si le trigger n'a pas fonctionné, c'est un problème de configuration Supabase
      console.log('✅ Le trigger PostgreSQL devrait avoir créé l\'enregistrement user automatiquement');
      console.log('Si l\'inscription échoue, vérifiez que le trigger est bien configuré dans Supabase');

      // Créer le profil selon le rôle
      console.log('Création du profil selon le rôle:', role);
      console.log('Profile data reçu:', profileData);
      
      const { clientCompanyService, providerService } = await import('@/services/databaseService');
      
      if (role === 'client') {
        console.log('Création de l\'entreprise cliente...');
        try {
          const newCompany = await clientCompanyService.create({
            userId: authData.user.id,
            ...profileData,
          });
          console.log('✅ Entreprise cliente créée:', newCompany.name);
          setClientCompany(newCompany);
        } catch (companyError: any) {
          console.error('❌ Erreur lors de la création de l\'entreprise cliente:', companyError);
          throw new Error(`Erreur lors de la création du profil: ${companyError.message}`);
        }
      } else if (role === 'provider') {
        console.log('Création du prestataire...');
        try {
          const newProvider = await providerService.create({
            userId: authData.user.id,
            averageRating: 0,
            totalRatings: 0,
            ...profileData,
          });
          console.log('✅ Prestataire créé:', newProvider.name);
          setProvider(newProvider);
        } catch (providerError: any) {
          console.error('❌ Erreur lors de la création du prestataire:', providerError);
          console.error('Type:', providerError?.constructor?.name);
          console.error('Code:', providerError?.code);
          console.error('Message:', providerError?.message);
          console.error('Details:', providerError?.details);
          
          // Vérifier si l'erreur contient du HTML (template d'email)
          const errorMessage = providerError?.message || '';
          if (typeof errorMessage === 'string' && errorMessage.includes('<!DOCTYPE html>')) {
            console.error('⚠️ Erreur contient du HTML (template d\'email)');
            throw new Error('Erreur de configuration Supabase. La fonction create_provider_profile retourne un template d\'email au lieu d\'un résultat. Vérifiez la configuration de la fonction SQL dans Supabase.');
          }
          
          // Message d'erreur plus clair
          let userFriendlyMessage = 'Erreur lors de la création du profil prestataire.';
          if (providerError?.message?.includes('function') || providerError?.message?.includes('does not exist')) {
            userFriendlyMessage = 'La fonction create_provider_profile n\'existe pas dans Supabase. Veuillez exécuter le script SQL de création de fonction.';
          } else if (providerError?.message?.includes('permission') || providerError?.code === '42501') {
            userFriendlyMessage = 'Erreur de permissions. Vérifiez les politiques RLS dans Supabase.';
          } else if (providerError?.message) {
            userFriendlyMessage = `Erreur: ${providerError.message}`;
          }
          
          throw new Error(userFriendlyMessage);
        }
      }

      // Note: On ne charge pas automatiquement le profil après inscription
      // L'utilisateur sera redirigé vers la page de connexion pour se connecter
      // Cela permet de s'assurer que l'utilisateur confirme son email si nécessaire
      
      console.log('=== INSCRIPTION RÉUSSIE ===');
      console.log('Email:', email);
      console.log('User ID:', authData.user.id);
      
      // Déconnecter l'utilisateur pour qu'il doive se connecter
      // Cela garantit qu'il confirme son email si nécessaire
      try {
        await authService.signOut();
        setUser(null);
        setClientCompany(null);
        setProvider(null);
        console.log('✅ Utilisateur déconnecté après inscription');
      } catch (signOutError: any) {
        console.error('⚠️ Erreur lors de la déconnexion (non bloquant):', signOutError);
        // Ne pas bloquer l'inscription si la déconnexion échoue
      }
      
      // Retourner les données de l'utilisateur pour vérifier le statut de confirmation
      return authData;
    } catch (error: any) {
      console.error('=== ERREUR D\'INSCRIPTION ===');
      console.error('Type:', error.constructor.name);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // Nettoyer l'état local d'abord
      setUser(null);
      setClientCompany(null);
      setProvider(null);
      
      // Essayer de se déconnecter de Supabase (peut échouer si pas de session, c'est OK)
      try {
        await authService.signOut();
      } catch (signOutError: any) {
        // Si l'erreur est liée à une session manquante, on l'ignore
        if (signOutError?.message?.includes('session missing') || 
            signOutError?.message?.includes('Auth session missing')) {
          console.log('⚠️ Session déjà absente, nettoyage local effectué');
        } else {
          console.warn('⚠️ Erreur lors de la déconnexion Supabase (non bloquant):', signOutError);
        }
      }
      
      // Nettoyer le stockage local et le cache
      try {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
        await AsyncStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY);
      } catch (storageError) {
        console.warn('⚠️ Erreur lors du nettoyage du stockage (non bloquant):', storageError);
      }
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Même en cas d'erreur, on nettoie l'état local
      setUser(null);
      setClientCompany(null);
      setProvider(null);
      // Ne pas throw l'erreur pour permettre la déconnexion même si Supabase échoue
    }
  };

  const updateProfile = async (data: any) => {
    try {
      console.log('Updating profile:', data);
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const { clientCompanyService, providerService } = await import('@/services/databaseService');
      
      if (user.role === 'client' && clientCompany) {
        const updated = await clientCompanyService.update(clientCompany.id, data);
        setClientCompany(updated);
        console.log('Client company updated');
      } else if (user.role === 'provider' && provider) {
        const updated = await providerService.update(provider.id, data);
        setProvider(updated);
        console.log('Provider updated');
      }

      // Mettre à jour le stockage local et invalider le cache
      const updatedData = {
        user,
        clientCompany: user.role === 'client' ? { ...clientCompany, ...data } : clientCompany,
        provider: user.role === 'provider' ? { ...provider, ...data } : provider,
      };
      
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedData));
      
      // Mettre à jour le cache avec le nouveau timestamp
      try {
        await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
          userId: user.id,
          ...updatedData,
        }));
        await AsyncStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (cacheError) {
        console.warn('⚠️ Erreur lors de la mise à jour du cache (non bloquant):', cacheError);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        clientCompany,
        provider,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

