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

interface AuthContextType {
  user: User | null;
  clientCompany: ClientCompany | null;
  provider: Provider | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, profileData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé pour stocker la session localement (fallback)
const SESSION_STORAGE_KEY = '@lmv_session';

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
          console.error('❌ Erreur lors du chargement du profil dans onAuthStateChange:', error);
          // Ne pas réinitialiser si la session existe toujours - juste logger l'erreur
          // La session Supabase est toujours valide, donc on ne doit pas déconnecter l'utilisateur
          console.warn('⚠️ Erreur lors du chargement du profil, mais session toujours valide');
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
      console.error('Error checking auth status:', error);
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Chargement du profil pour user ID:', userId);
      
      // Timeout de sécurité pour éviter que la fonction reste bloquée
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout lors du chargement du profil')), 15000); // 15 secondes max
      });
      
      const userDataPromise = userService.getUserById(userId);
      const userData = await Promise.race([userDataPromise, timeoutPromise]) as any;
      
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
        const company = await clientCompanyService.getByUserId(userId);
        if (company) {
          console.log('✅ Client company loaded:', company.name);
          setClientCompany(company);
            
            // Sauvegarder en local (fallback) - seulement si on a réussi à charger
            try {
              await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                user: userData,
                clientCompany: company,
                provider: null,
              }));
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
          const providerData = await providerService.getByUserId(userId);
          if (providerData) {
            console.log('✅ Provider loaded:', providerData.name);
            setProvider(providerData);
            
            // Sauvegarder en local (fallback) - seulement si on a réussi à charger
            try {
              await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                user: userData,
                clientCompany: null,
                provider: providerData,
              }));
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
      console.error('❌ Error loading user profile:', error);
      throw error;
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
      
      // Charger le profil utilisateur
      await loadUserProfile(authUser.id);
      
      console.log('Login completed successfully');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Gérer spécifiquement l'erreur de confirmation d'email
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email not confirmed')) {
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
          throw new Error(`Erreur lors de la création du profil: ${providerError.message}`);
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
      await authService.signOut();
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      setUser(null);
      setClientCompany(null);
      setProvider(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
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

      // Mettre à jour le stockage local
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        user,
        clientCompany: user.role === 'client' ? { ...clientCompany, ...data } : clientCompany,
        provider: user.role === 'provider' ? { ...provider, ...data } : provider,
      }));
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

