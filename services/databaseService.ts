/**
 * Service de Base de Données
 * 
 * Ce service centralise toutes les opérations de base de données
 */

import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { User, ClientCompany, Provider, WashRequest, WashRequestStatus, Vehicle, Rating } from '@/types';

// ============================================
// UTILITAIRES
// ============================================

/**
 * Convertit une date PostgreSQL en Date JavaScript
 */
const parseDate = (dateString: string | null): Date => {
  return dateString ? new Date(dateString) : new Date();
};

// ============================================
// AUTHENTIFICATION
// ============================================

export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signUp(email: string, password: string, role: 'client' | 'provider' | 'admin') {
    console.log('🔐 authService.signUp appelé');
    console.log('Email:', email);
    console.log('Role:', role);
    
    // Normaliser l'email (minuscules, trim)
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Email normalisé:', normalizedEmail);
    
    // Déterminer l'URL de redirection après confirmation d'email
    let emailRedirectTo: string | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Sur web, utiliser l'URL actuelle
      emailRedirectTo = `${window.location.origin}/auth/login`;
    } else {
      // Sur mobile, utiliser le deep link
      emailRedirectTo = 'lmv://auth/login';
    }

    console.log('📧 Configuration email:');
    console.log('emailRedirectTo:', emailRedirectTo);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          role,
        },
        emailRedirectTo, // URL de redirection après confirmation d'email
        // Forcer l'envoi de l'email même si auto-confirm est activé
        // En ajoutant cette option, Supabase enverra toujours un email de confirmation
      },
    });

    console.log('📧 Réponse Supabase Auth:');
    console.log('Data:', data ? 'présente' : 'absente');
    console.log('User:', data?.user ? data.user.email : 'aucun');
    console.log('User confirmed:', data?.user?.email_confirmed_at ? 'OUI' : 'NON');
    console.log('Session:', data?.session ? 'présente' : 'absente');
    console.log('User ID:', data?.user?.id);
    
    // Vérifier si l'email a été envoyé
    if (data?.user && !data?.user.email_confirmed_at) {
      console.log('✅ Email de confirmation devrait être envoyé (utilisateur non confirmé)');
    } else if (data?.user?.email_confirmed_at) {
      console.log('⚠️ Utilisateur déjà confirmé - l\'email de confirmation n\'a peut-être pas été envoyé');
      console.log('💡 Vérifiez les paramètres Supabase: Authentication > Settings > Enable email confirmations');
    }
    
    if (error) {
      console.error('❌ Erreur Supabase Auth signUp:', error);
      console.error('Code:', error.status);
      console.error('Message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      // Messages d'erreur plus clairs pour l'utilisateur
      if (error.message?.includes('Signups not allowed') || error.code === 'signup_disabled') {
        throw new Error('Les inscriptions sont désactivées dans Supabase. Veuillez activer les inscriptions dans Authentication > Settings > Enable sign ups.');
      }
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        throw new Error('Un compte avec cet email existe déjà');
      }
      if (error.message?.includes('invalid')) {
        throw new Error('Format d\'email invalide. Veuillez utiliser un email valide (ex: votre.nom@gmail.com)');
      }
      if (error.message?.includes('password')) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }
      
      throw error;
    }
    
    if (!data) {
      throw new Error('Aucune donnée retournée par Supabase Auth');
    }
    
    // Note: Si l'email confirmation est activée, data.user existe mais data.session est null
    // Dans ce cas, l'utilisateur doit confirmer son email avant de pouvoir se connecter
    if (!data.user) {
      throw new Error('Aucun utilisateur retourné par Supabase Auth');
    }
    
    console.log('✅ authService.signUp réussi');
    return data;
  },

  /**
   * Connexion d'un utilisateur
   */
  async signIn(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('🔐 Tentative de connexion pour:', normalizedEmail);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error('❌ Erreur de connexion:', error);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Status:', error.status);
      throw error;
    }
    
    console.log('✅ Connexion réussie');
    console.log('User ID:', data.user?.id);
    console.log('Email confirmé:', data.user?.email_confirmed_at ? 'OUI' : 'NON');
    console.log('Email confirmé à:', data.user?.email_confirmed_at);
    
    return data;
  },

  /**
   * Déconnexion
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Récupère l'utilisateur actuel
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Récupère la session actuelle
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Vérifie si un email existe dans auth.users
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data, error } = await supabase.rpc('check_email_exists', {
        p_email: normalizedEmail,
      });

      if (error) {
        console.error('Error checking email:', error);
        // En cas d'erreur (par exemple si la fonction n'existe pas), retourner false
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in checkEmailExists:', error);
      return false;
    }
  },

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async resetPasswordForEmail(email: string, redirectTo?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: redirectTo,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Renvoie un email de confirmation
   */
  async resendConfirmationEmail(email: string, redirectTo?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('📧 Renvoi de l\'email de confirmation pour:', normalizedEmail);
    
    let emailRedirectTo: string | undefined = redirectTo;
    if (!emailRedirectTo) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        emailRedirectTo = `${window.location.origin}/auth/login`;
      } else {
        emailRedirectTo = 'lmv://auth/login';
      }
    }
    
    console.log('📧 emailRedirectTo:', emailRedirectTo);
    
    // Utiliser resend avec type 'signup' pour renvoyer l'email de confirmation
    // Cette méthode fonctionne même si l'utilisateur existe déjà mais n'a pas confirmé son email
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      console.error('❌ Erreur lors du renvoi de l\'email de confirmation:', error);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      throw error;
    }
    
    console.log('✅ Email de confirmation renvoyé');
    return data;
  },
};

// ============================================
// USERS
// ============================================

export const userService = {
  /**
   * Récupère un utilisateur par ID
   */
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Si l'utilisateur n'existe pas (PGRST116 = no rows returned)
      if (error.code === 'PGRST116') {
        console.warn('⚠️ User not found in users table, might need to run fix_missing_users.sql');
        return null;
      }
      throw error;
    }
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      role: data.role,
      createdAt: parseDate(data.created_at),
    };
  },

  /**
   * Récupère l'utilisateur actuel avec son profil
   */
  async getCurrentUserWithProfile(): Promise<{
    user: User;
    clientCompany?: ClientCompany;
    provider?: Provider;
  } | null> {
    const user = await authService.getCurrentUser();
    if (!user) return null;

    const userData = await this.getUserById(user.id);
    if (!userData) return null;

    let clientCompany: ClientCompany | undefined;
    let provider: Provider | undefined;

    if (userData.role === 'client') {
      clientCompany = await clientCompanyService.getByUserId(user.id) || undefined;
    } else if (userData.role === 'provider') {
      provider = await providerService.getByUserId(user.id) || undefined;
    }

    return {
      user: userData,
      clientCompany,
      provider,
    };
  },
};

// ============================================
// CLIENT COMPANIES
// ============================================

export const clientCompanyService = {
  /**
   * Crée une entreprise cliente en utilisant la fonction SQL (contourne RLS)
   */
  async createWithFunction(data: Omit<ClientCompany, 'id'>): Promise<ClientCompany> {
    console.log('🔧 clientCompanyService.createWithFunction appelé');
    console.log('Données:', { userId: data.userId, name: data.name });
    
    const { data: result, error } = await supabase.rpc('create_client_company_profile', {
      p_user_id: data.userId,
      p_name: data.name,
      p_address: data.address,
      p_contact: data.contact,
      p_phone: data.phone,
      p_email: data.email,
    });

    if (error) {
      console.error('❌ Erreur lors de la création via fonction SQL:', error);
      throw error;
    }

    if (!result || result.length === 0) {
      throw new Error('Aucune donnée retournée par la fonction SQL');
    }

    const companyData = result[0];
    console.log('✅ Entreprise créée via fonction SQL:', companyData);

    // Construire l'objet ClientCompany à partir des données retournées
    return {
      id: companyData.id,
      userId: companyData.user_id,
      name: companyData.name,
      address: companyData.address,
      contact: companyData.contact,
      phone: companyData.phone,
      email: companyData.email,
    };
  },

  /**
   * Crée une entreprise cliente
   */
  async create(data: Omit<ClientCompany, 'id'>): Promise<ClientCompany> {
    console.log('🔧 clientCompanyService.create appelé');
    console.log('Données:', { userId: data.userId, name: data.name });
    
    // Essayer d'abord avec la méthode normale
    try {
      const { data: result, error } = await supabase
        .from('client_companies')
        .insert({
          user_id: data.userId,
          name: data.name,
          address: data.address,
          contact: data.contact,
          phone: data.phone,
          email: data.email,
        })
        .select()
        .single();

      if (error) {
        // Si erreur RLS, utiliser la fonction SQL
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          console.log('⚠️ Erreur RLS détectée, utilisation de la fonction SQL...');
          return await this.createWithFunction(data);
        }
        console.error('❌ Erreur clientCompanyService.create:', error);
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        throw error;
      }
      
      console.log('✅ clientCompanyService.create réussi');

      return {
        id: result.id,
        userId: result.user_id,
        name: result.name,
        address: result.address,
        contact: result.contact,
        phone: result.phone,
        email: result.email,
      };
    } catch (error: any) {
      // Si erreur RLS, utiliser la fonction SQL
      if (error?.code === '42501' || error?.message?.includes('row-level security')) {
        console.log('⚠️ Erreur RLS détectée dans catch, utilisation de la fonction SQL...');
        return await this.createWithFunction(data);
      }
      throw error;
    }
  },

  /**
   * Récupère une entreprise par user_id
   */
  async getByUserId(userId: string): Promise<ClientCompany | null> {
    const { data, error } = await supabase
      .from('client_companies')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      address: data.address,
      contact: data.contact,
      phone: data.phone,
      email: data.email,
      avatarUrl: data.avatar_url || undefined,
    };
  },

  /**
   * Met à jour une entreprise
   */
  async update(id: string, updates: Partial<Omit<ClientCompany, 'id' | 'userId'>>): Promise<ClientCompany> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.address) updateData.address = updates.address;
    if (updates.contact) updateData.contact = updates.contact;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.email) updateData.email = updates.email;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl || null;

    const { data, error } = await supabase
      .from('client_companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      address: data.address,
      contact: data.contact,
      phone: data.phone,
      email: data.email,
      avatarUrl: data.avatar_url || undefined,
    };
  },
};

// ============================================
// PROVIDERS
// ============================================

export const providerService = {
  /**
   * Crée un prestataire en utilisant la fonction SQL (contourne RLS)
   */
  async createWithFunction(data: Omit<Provider, 'id' | 'averageRating' | 'totalRatings'> & { email?: string }): Promise<Provider> {
    console.log('🔧 providerService.createWithFunction appelé');
    console.log('Données:', { userId: data.userId, name: data.name });
    
    const { data: result, error } = await supabase.rpc('create_provider_profile', {
      p_user_id: data.userId,
      p_name: data.name,
      p_base_city: data.baseCity,
      p_radius_km: data.radiusKm,
      p_phone: data.phone,
      p_description: data.description || null,
      p_services: data.services || [],
    });

    if (error) {
      console.error('❌ Erreur lors de la création via fonction SQL:', error);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      
      // Vérifier si l'erreur contient du HTML (template d'email)
      if (typeof error.message === 'string' && error.message.includes('<!DOCTYPE html>')) {
        console.error('⚠️ Erreur contient du HTML (template d\'email) - probablement une erreur de configuration Supabase');
        throw new Error('Erreur de configuration Supabase. La fonction create_provider_profile n\'est peut-être pas correctement configurée. Vérifiez les logs Supabase.');
      }
      
      // Vérifier si c'est une erreur de fonction non trouvée ou signature incorrecte
      if (error.code === 'PGRST202' || (error.message && error.message.includes('Could not find the function'))) {
        console.error('⚠️ La fonction create_provider_profile n\'existe pas ou a une signature incorrecte dans Supabase');
        console.error('💡 ACTION REQUISE:');
        console.error('   1. Allez dans Supabase Dashboard > SQL Editor');
        console.error('   2. Exécutez le script SQL: database/create_profile_function.sql');
        console.error('   3. Assurez-vous que la fonction create_provider_profile est bien créée SANS le paramètre p_email');
        console.error('   4. La signature correcte est: create_provider_profile(p_user_id, p_name, p_base_city, p_radius_km, p_phone, p_description, p_services)');
        throw new Error('La fonction create_provider_profile n\'existe pas ou a une signature incorrecte dans Supabase. Veuillez exécuter le script SQL mis à jour: database/create_profile_function.sql');
      }
      
      throw error;
    }

    if (!result || result.length === 0) {
      throw new Error('Aucune donnée retournée par la fonction SQL create_provider_profile. Vérifiez que la fonction existe et est correctement configurée.');
    }

    const providerData = result[0];
    console.log('✅ Prestataire créé via fonction SQL:', providerData);

    // Construire l'objet Provider à partir des données retournées
    return {
      id: providerData.id,
      userId: providerData.user_id,
      name: providerData.name,
      baseCity: providerData.base_city,
      radiusKm: providerData.radius_km,
      phone: providerData.phone,
      description: providerData.description || '',
      services: providerData.services || [],
      averageRating: providerData.average_rating || 0,
      totalRatings: providerData.total_ratings || 0,
    };
  },

  /**
   * Crée un prestataire
   */
  async create(data: Omit<Provider, 'id' | 'averageRating' | 'totalRatings'>): Promise<Provider> {
    console.log('🔧 providerService.create appelé');
    console.log('Données:', { userId: data.userId, name: data.name });
    
    // Essayer d'abord avec la méthode normale
    try {
      const { data: result, error } = await supabase
        .from('providers')
        .insert({
          user_id: data.userId,
          name: data.name,
          base_city: data.baseCity,
          radius_km: data.radiusKm,
          phone: data.phone,
          description: data.description,
          services: data.services,
        })
        .select()
        .single();

      if (error) {
        // Si erreur RLS, utiliser la fonction SQL
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          console.log('⚠️ Erreur RLS détectée, utilisation de la fonction SQL...');
          return await this.createWithFunction(data);
        }
        console.error('❌ Erreur providerService.create:', error);
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        throw error;
      }
      
      console.log('✅ providerService.create réussi');

      return {
        id: result.id,
        userId: result.user_id,
        name: result.name,
        baseCity: result.base_city,
        radiusKm: result.radius_km,
        phone: result.phone,
        description: result.description,
        services: result.services,
        averageRating: result.average_rating || 0,
        totalRatings: result.total_ratings || 0,
      };
    } catch (error: any) {
      // Si erreur RLS, utiliser la fonction SQL
      if (error?.code === '42501' || error?.message?.includes('row-level security')) {
        console.log('⚠️ Erreur RLS détectée dans catch, utilisation de la fonction SQL...');
        return await this.createWithFunction(data);
      }
      throw error;
    }
  },

  /**
   * Récupère un prestataire par ID
   */
  async getById(id: string): Promise<Provider | null> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      baseCity: data.base_city,
      radiusKm: data.radius_km,
      phone: data.phone,
      description: data.description,
      services: data.services,
      averageRating: data.average_rating || 0,
      totalRatings: data.total_ratings || 0,
      avatarUrl: data.avatar_url || undefined,
    };
  },

  /**
   * Récupère un prestataire par user_id
   */
  async getByUserId(userId: string): Promise<Provider | null> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      baseCity: data.base_city,
      radiusKm: data.radius_km,
      phone: data.phone,
      description: data.description,
      services: data.services,
      averageRating: data.average_rating || 0,
      totalRatings: data.total_ratings || 0,
      avatarUrl: data.avatar_url || undefined,
    };
  },

  /**
   * Récupère tous les prestataires
   */
  async getAll(): Promise<Provider[]> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map((p) => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      baseCity: p.base_city,
      radiusKm: p.radius_km,
      phone: p.phone,
      description: p.description,
      services: p.services,
      averageRating: p.average_rating || 0,
      totalRatings: p.total_ratings || 0,
    }));
  },

  /**
   * Met à jour un prestataire
   */
  async update(id: string, updates: Partial<Omit<Provider, 'id' | 'userId'>>): Promise<Provider> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.baseCity) updateData.base_city = updates.baseCity;
    if (updates.radiusKm !== undefined) updateData.radius_km = updates.radiusKm;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.services) updateData.services = updates.services;

    const { data, error } = await supabase
      .from('providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      baseCity: data.base_city,
      radiusKm: data.radius_km,
      phone: data.phone,
      description: data.description,
      services: data.services,
      averageRating: data.average_rating || 0,
      totalRatings: data.total_ratings || 0,
      avatarUrl: data.avatar_url || undefined,
    };
  },
};

// ============================================
// WASH REQUESTS
// ============================================

export const washRequestService = {
  /**
   * Crée une demande de lavage
   */
  async create(
    data: Omit<WashRequest, 'id' | 'createdAt' | 'clientCompany' | 'provider'>,
    vehicles?: Array<{ vehicleId: string; serviceType: 'exterior' | 'interior' | 'complete' }>
  ): Promise<WashRequest> {
    console.log('🔧 washRequestService.create appelé');
    console.log('Données:', { clientCompanyId: data.clientCompanyId, address: data.address });
    
    // Créer la demande de lavage
    const { data: result, error } = await supabase
      .from('wash_requests')
      .insert({
        client_company_id: data.clientCompanyId,
        provider_id: data.providerId || null,
        address: data.address,
        date_time: data.dateTime.toISOString(),
        status: data.status,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création de la demande:', error);
      throw error;
    }

    console.log('✅ Demande de lavage créée:', result.id);

    // Créer les wash_request_vehicles si des véhicules sont fournis
    if (vehicles && vehicles.length > 0) {
      console.log('Création des wash_request_vehicles...', vehicles);
      const vehicleInserts = vehicles.map(v => ({
        wash_request_id: result.id,
        vehicle_id: v.vehicleId,
        service_type: v.serviceType,
      }));

      const { error: vehiclesError } = await supabase
        .from('wash_request_vehicles')
        .insert(vehicleInserts);

      if (vehiclesError) {
        console.error('❌ Erreur lors de la création des wash_request_vehicles:', vehiclesError);
        throw vehiclesError;
      }

      console.log('✅ wash_request_vehicles créés');
    }

    // Envoyer une notification aux prestataires pour la nouvelle demande
    if (data.status === 'pending') {
      // Notification push
      try {
        const { notifyProvidersOfNewRequest } = await import('./notificationService');
        await notifyProvidersOfNewRequest(result.id, result.address);
      } catch (notificationError) {
        // Ne pas faire échouer la création si la notification échoue
        console.error('❌ Erreur lors de l\'envoi des notifications push (non bloquant):', notificationError);
      }

      // Envoi d'email aux prestataires
      try {
        // Récupérer le nom du client pour l'email
        const { data: clientData } = await supabase
          .from('client_companies')
          .select('name')
          .eq('id', data.clientCompanyId)
          .single();

        const { sendNewRequestEmailToProviders } = await import('./emailService');
        await sendNewRequestEmailToProviders({
          id: result.id,
          address: result.address,
          dateTime: parseDate(result.date_time),
          clientCompanyName: clientData?.name,
          notes: result.notes || undefined,
        });
      } catch (emailError) {
        // Ne pas faire échouer la création si l'email échoue
        console.error('❌ Erreur lors de l\'envoi des emails aux prestataires (non bloquant):', emailError);
      }
    }

    return {
      id: result.id,
      clientCompanyId: result.client_company_id,
      providerId: result.provider_id || undefined,
      address: result.address,
      dateTime: parseDate(result.date_time),
      status: result.status,
      notes: result.notes || undefined,
      createdAt: parseDate(result.created_at),
      vehicles: [], // Les véhicules seront chargés séparément si nécessaire
    };
  },

  /**
   * Récupère une demande par ID
   */
  async getById(id: string): Promise<WashRequest | null> {
    const { data, error } = await supabase
      .from('wash_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    // Charger les véhicules associés
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('wash_request_vehicles')
      .select('*, vehicles(*)')
      .eq('wash_request_id', id);

    const vehicles = vehiclesData?.map((wrv: any) => ({
      id: wrv.id,
      washRequestId: wrv.wash_request_id,
      vehicleId: wrv.vehicle_id,
      serviceType: wrv.service_type as 'exterior' | 'interior' | 'complete',
      vehicle: wrv.vehicles ? {
        id: wrv.vehicles.id,
        clientCompanyId: wrv.vehicles.client_company_id,
        licensePlate: wrv.vehicles.license_plate,
        brand: wrv.vehicles.brand,
        model: wrv.vehicles.model,
        type: wrv.vehicles.type,
      } : undefined,
    })) || [];

    return {
      id: data.id,
      clientCompanyId: data.client_company_id,
      providerId: data.provider_id || undefined,
      address: data.address,
      dateTime: parseDate(data.date_time),
      status: data.status,
      notes: data.notes || undefined,
      invoiceUrl: data.invoice_url || undefined,
      createdAt: parseDate(data.created_at),
      vehicles,
    };
  },

  /**
   * Récupère les demandes pour une entreprise cliente
   */
  async getByClientCompanyId(clientCompanyId: string): Promise<WashRequest[]> {
    const { data, error } = await supabase
      .from('wash_requests')
      .select('*')
      .eq('client_company_id', clientCompanyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Charger les véhicules pour chaque demande
    const requestsWithVehicles = await Promise.all(
      data.map(async (wr) => {
        // Charger les véhicules associés
        const { data: vehiclesData } = await supabase
          .from('wash_request_vehicles')
          .select('*, vehicles(*)')
          .eq('wash_request_id', wr.id);

        const vehicles = vehiclesData?.map((wrv: any) => ({
          id: wrv.id,
          washRequestId: wrv.wash_request_id,
          vehicleId: wrv.vehicle_id,
          serviceType: wrv.service_type as 'exterior' | 'interior' | 'complete',
          vehicle: wrv.vehicles ? {
            id: wrv.vehicles.id,
            clientCompanyId: wrv.vehicles.client_company_id,
            licensePlate: wrv.vehicles.license_plate,
            brand: wrv.vehicles.brand,
            model: wrv.vehicles.model,
            type: wrv.vehicles.type,
            year: wrv.vehicles.year,
            imageUrl: wrv.vehicles.image_url,
          } : undefined,
        })) || [];

        return {
      id: wr.id,
      clientCompanyId: wr.client_company_id,
      providerId: wr.provider_id || undefined,
      address: wr.address,
      dateTime: parseDate(wr.date_time),
      status: wr.status,
      notes: wr.notes || undefined,
      invoiceUrl: wr.invoice_url || undefined,
      createdAt: parseDate(wr.created_at),
          vehicles,
        };
      })
    );

    return requestsWithVehicles;
  },

  /**
   * Récupère les demandes pour un prestataire
   */
  async getByProviderId(providerId: string): Promise<WashRequest[]> {
    const { data, error } = await supabase
      .from('wash_requests')
      .select('*')
      .eq('provider_id', providerId)
      .order('date_time', { ascending: true });

    if (error) throw error;

    // Charger les informations complètes pour chaque demande
    const requestsWithDetails = await Promise.all(
      data.map(async (wr: any) => {
        // Charger le client company
        let clientCompany = null;
        try {
          const { data: companyData } = await supabase
            .from('client_companies')
            .select('*')
            .eq('id', wr.client_company_id)
            .single();
          
          if (companyData) {
            clientCompany = {
              id: companyData.id,
              userId: companyData.user_id,
              name: companyData.name,
              address: companyData.address,
              contact: companyData.contact,
              phone: companyData.phone,
              email: companyData.email,
            };
          }
        } catch (companyError) {
          console.warn('⚠️ Erreur lors du chargement du client company:', companyError);
        }

        // Charger les véhicules
        const { data: vehiclesData } = await supabase
          .from('wash_request_vehicles')
          .select('*, vehicles(*)')
          .eq('wash_request_id', wr.id);

        const vehicles = (vehiclesData || []).map((wrv: any) => ({
          id: wrv.id,
          washRequestId: wrv.wash_request_id,
          vehicleId: wrv.vehicle_id,
          serviceType: wrv.service_type,
          vehicle: wrv.vehicles ? {
            id: wrv.vehicles.id,
            clientCompanyId: wrv.vehicles.client_company_id,
            licensePlate: wrv.vehicles.license_plate,
            brand: wrv.vehicles.brand,
            model: wrv.vehicles.model,
            type: wrv.vehicles.type,
            year: wrv.vehicles.year,
            imageUrl: wrv.vehicles.image_url,
          } : undefined,
        }));

        return {
      id: wr.id,
      clientCompanyId: wr.client_company_id,
      providerId: wr.provider_id || undefined,
      address: wr.address,
      dateTime: parseDate(wr.date_time),
      status: wr.status,
      notes: wr.notes || undefined,
      invoiceUrl: wr.invoice_url || undefined,
      createdAt: parseDate(wr.created_at),
          vehicles,
          clientCompany: clientCompany || undefined,
        };
      })
    );

    return requestsWithDetails;
  },

  /**
   * Récupère les demandes avec le statut 'pending' (sans provider assigné)
   * Si providerId est fourni, inclut aussi les demandes annulées par ce provider
   */
  async getPendingRequests(providerId?: string): Promise<{ requests: WashRequest[]; cancelledIds: string[] }> {
    console.log('🔧 getPendingRequests appelé');
    
    // Test 1: Vérifier toutes les demandes (sans filtre)
    const { data: allData, error: allError } = await supabase
      .from('wash_requests')
      .select('id, status, provider_id, client_company_id, created_at')
      .limit(10);
    
    console.log('🔍 Toutes les demandes (max 10):', allData?.length || 0);
    if (allData && allData.length > 0) {
      console.log('🔍 Détails:', JSON.stringify(allData, null, 2));
    }
    if (allError) {
      console.error('❌ Erreur lors de la récupération de toutes les demandes:', allError);
    }
    
    // Test 2: Vérifier toutes les demandes 'pending'
    const { data: allPendingData, error: pendingError } = await supabase
      .from('wash_requests')
      .select('id, status, provider_id, client_company_id, created_at')
      .eq('status', 'pending');
    
    console.log('🔍 Demandes avec status=pending:', allPendingData?.length || 0);
    if (allPendingData && allPendingData.length > 0) {
      console.log('🔍 Détails pending:', JSON.stringify(allPendingData, null, 2));
      console.log('🔍 Provider IDs:', allPendingData.map((r: any) => ({ id: r.id, provider_id: r.provider_id })));
    }
    if (pendingError) {
      console.error('❌ Erreur lors de la récupération des demandes pending:', pendingError);
    }
    
    // D'abord, récupérer les demandes de base avec status='pending' et provider_id IS NULL
    const { data: requestsData, error: requestsError } = await supabase
      .from('wash_requests')
      .select('*')
      .eq('status', 'pending')
      .is('provider_id', null)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('❌ Erreur getPendingRequests (requests):', requestsError);
      console.error('❌ Code:', requestsError.code);
      console.error('❌ Message:', requestsError.message);
      console.error('❌ Details:', requestsError.details);
      throw requestsError;
    }

    console.log('✅ Demandes pending trouvées (sans provider):', requestsData?.length || 0);

    // Récupérer les IDs des demandes annulées par ce provider si providerId est fourni
    let cancelledIds: string[] = [];
    if (providerId) {
      cancelledIds = await this.getCancelledRequestIds(providerId);
    }

    if (!requestsData || requestsData.length === 0) {
      return { requests: [], cancelledIds };
    }

    // Charger les informations complètes pour chaque demande
    const requestsWithDetails = await Promise.all(
      requestsData.map(async (wr: any) => {
        // Charger le client company (même approche que getByProviderId)
        let clientCompany = null;
        
        if (!wr.client_company_id) {
          console.warn('⚠️ Wash request sans client_company_id:', wr.id);
        } else {
          try {
            console.log('🔍 Chargement du client company pour:', wr.client_company_id);
            const { data: companyData, error: companyError } = await supabase
              .from('client_companies')
              .select('*')
              .eq('id', wr.client_company_id)
              .single();
            
            if (companyError) {
              console.error('❌ Erreur lors du chargement du client company:', companyError);
              console.error('   Code:', companyError.code);
              console.error('   Message:', companyError.message);
              console.error('   Details:', companyError.details);
              console.error('   Hint:', companyError.hint);
            } else if (companyData) {
              console.log('✅ Client company chargé:', companyData.name || companyData.id);
              clientCompany = {
                id: companyData.id,
                userId: companyData.user_id,
                name: companyData.name,
                address: companyData.address,
                contact: companyData.contact,
                phone: companyData.phone,
                email: companyData.email,
              };
            } else {
              console.warn('⚠️ Aucune donnée retournée pour client_company_id:', wr.client_company_id);
            }
          } catch (companyError: any) {
            console.error('❌ Exception lors du chargement du client company:', companyError);
            console.error('   Message:', companyError.message);
            console.error('   Stack:', companyError.stack);
          }
        }

        // Charger les véhicules
        const { data: vehiclesData } = await supabase
          .from('wash_request_vehicles')
          .select('*, vehicles(*)')
          .eq('wash_request_id', wr.id);

        const vehicles = (vehiclesData || []).map((wrv: any) => ({
          id: wrv.id,
          washRequestId: wrv.wash_request_id,
          vehicleId: wrv.vehicle_id,
          serviceType: wrv.service_type,
          vehicle: wrv.vehicles ? {
            id: wrv.vehicles.id,
            clientCompanyId: wrv.vehicles.client_company_id,
            licensePlate: wrv.vehicles.license_plate,
            brand: wrv.vehicles.brand,
            model: wrv.vehicles.model,
            type: wrv.vehicles.type,
            year: wrv.vehicles.year,
            imageUrl: wrv.vehicles.image_url,
          } : undefined,
        }));

        return {
          id: wr.id,
          clientCompanyId: wr.client_company_id,
          providerId: wr.provider_id || undefined,
          address: wr.address,
          dateTime: parseDate(wr.date_time),
          status: wr.status,
          notes: wr.notes || undefined,
          invoiceUrl: wr.invoice_url || undefined,
          createdAt: parseDate(wr.created_at),
          vehicles,
          clientCompany: clientCompany || undefined,
        };
      })
    );

    console.log('✅ Demandes complètes chargées:', requestsWithDetails.length);
    return { requests: requestsWithDetails, cancelledIds };
  },

  /**
   * Supprime une demande de lavage
   * Envoie un email au prestataire si un prestataire est assigné
   */
  async delete(id: string): Promise<void> {
    console.log('🔧 washRequestService.delete appelé');
    console.log('ID de la demande à supprimer:', id);
    
    // Récupérer les informations de la demande avant suppression pour envoyer l'email
    const { data: requestData, error: fetchError } = await supabase
      .from('wash_requests')
      .select('id, address, date_time, provider_id, client_company_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération de la demande:', fetchError);
      throw fetchError;
    }

    // Si un prestataire est assigné, envoyer un email d'annulation
    if (requestData?.provider_id) {
      console.log('📧 Prestataire assigné détecté, envoi d\'email d\'annulation...');
      console.log('   Provider ID:', requestData.provider_id);
      
      try {
        // Récupérer les informations du prestataire
        const { data: providerData, error: providerError } = await supabase
          .from('providers')
          .select('name, user_id')
          .eq('id', requestData.provider_id)
          .single();

        if (providerError) {
          console.error('❌ Erreur lors de la récupération du prestataire:', providerError);
        } else if (providerData) {
          console.log('   Prestataire trouvé:', providerData.name);
          console.log('   User ID:', providerData.user_id);
          
          // Essayer d'abord avec la fonction SQL pour récupérer l'email depuis auth.users
          let providerEmail: string | null = null;
          try {
            const { data: emailsData, error: rpcError } = await supabase.rpc('get_provider_emails', {
              provider_user_ids: [providerData.user_id],
            });
            
            if (!rpcError && emailsData && emailsData.length > 0) {
              providerEmail = emailsData[0].email;
              console.log('   Email récupéré via fonction SQL:', providerEmail);
            } else {
              console.warn('   Fonction get_provider_emails non disponible ou aucun résultat, tentative depuis users...');
              // Fallback: récupérer depuis la table users
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email')
                .eq('id', providerData.user_id)
                .single();
              
              if (userError) {
                console.error('   Erreur lors de la récupération depuis users:', userError);
              } else if (userData?.email) {
                providerEmail = userData.email;
                console.log('   Email récupéré depuis users:', providerEmail);
              }
            }
          } catch (emailFetchError: any) {
            console.error('   Erreur lors de la récupération de l\'email:', emailFetchError);
          }

          // Récupérer le nom du client
          let clientCompanyName: string | undefined;
          if (requestData.client_company_id) {
            const { data: clientData } = await supabase
              .from('client_companies')
              .select('name')
              .eq('id', requestData.client_company_id)
              .single();
            clientCompanyName = clientData?.name;
            console.log('   Client:', clientCompanyName);
          }

          if (providerEmail) {
            console.log('📧 Envoi de l\'email d\'annulation à:', providerEmail);
            // Importer et appeler le service d'email de manière asynchrone (ne pas bloquer)
            // Utiliser un setTimeout pour ne pas bloquer la suppression
            setTimeout(async () => {
              try {
                console.log('   Import du service d\'email...');
                const { sendJobCancellationEmail } = await import('@/services/emailService');
                console.log('   Service d\'email importé, appel de sendJobCancellationEmail...');
                await sendJobCancellationEmail(
                  providerEmail!,
                  providerData.name,
                  {
                    id: requestData.id,
                    address: requestData.address,
                    dateTime: parseDate(requestData.date_time),
                    clientCompanyName,
                  }
                );
                console.log('✅ Email d\'annulation envoyé avec succès');
              } catch (emailError: any) {
                console.error('❌ Erreur lors de l\'envoi de l\'email d\'annulation (non bloquant):', emailError);
                console.error('   Type:', emailError.constructor?.name || 'Unknown');
                console.error('   Message:', emailError.message || 'N/A');
                console.error('   Stack:', emailError.stack || 'N/A');
              }
            }, 0);
          } else {
            console.warn('⚠️ Email du prestataire non trouvé, impossible d\'envoyer la notification d\'annulation');
            console.warn('   Provider ID:', requestData.provider_id);
            console.warn('   User ID:', providerData.user_id);
          }
        } else {
          console.warn('⚠️ Prestataire non trouvé pour l\'ID:', requestData.provider_id);
        }
      } catch (emailSetupError: any) {
        console.error('❌ Erreur lors de la préparation de l\'email d\'annulation (non bloquant):', emailSetupError);
        console.error('   Stack:', emailSetupError.stack);
        // Ne pas bloquer la suppression si l'email échoue
      }
    } else {
      console.log('ℹ️ Aucun prestataire assigné à cette demande, pas d\'email à envoyer');
    }

    // Supprimer la demande
    const { error } = await supabase
      .from('wash_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erreur washRequestService.delete:', error);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      throw error;
    }
    
    console.log('✅ washRequestService.delete réussi');
  },

  /**
   * Met à jour une demande
   */
  async update(id: string, updates: Partial<Omit<WashRequest, 'id' | 'createdAt'>>): Promise<WashRequest> {
    const updateData: any = {};
    if (updates.providerId !== undefined) updateData.provider_id = updates.providerId ?? null;
    if (updates.address) updateData.address = updates.address;
    if (updates.dateTime) updateData.date_time = updates.dateTime.toISOString();
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.invoiceUrl !== undefined) updateData.invoice_url = updates.invoiceUrl || null;

    // Récupérer la demande actuelle pour vérifier si un prestataire est assigné
    const { data: currentRequest } = await supabase
      .from('wash_requests')
      .select('provider_id, status, address, date_time, client_company_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('wash_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Si un prestataire vient d'être assigné et que le statut est 'accepted', envoyer des emails
    const providerJustAssigned = 
      updates.providerId !== undefined && 
      updates.providerId !== null && 
      (!currentRequest?.provider_id || currentRequest.provider_id !== updates.providerId) &&
      (updates.status === 'accepted' || (!updates.status && currentRequest?.status === 'accepted'));

    if (providerJustAssigned && updates.providerId) {
      console.log('📧 Nouveau job assigné, envoi d\'emails au prestataire et au client...');
      
      // Récupérer les informations du prestataire
      const { data: providerData } = await supabase
        .from('providers')
        .select('name, user_id, phone')
        .eq('id', updates.providerId)
        .single();

      if (providerData) {
        // Récupérer l'email du prestataire depuis users
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', providerData.user_id)
          .single();

        // Récupérer les informations du client
        let clientCompanyName: string | undefined;
        let clientEmail: string | undefined;
        if (data.client_company_id) {
          const { data: clientData } = await supabase
            .from('client_companies')
            .select('name, email')
            .eq('id', data.client_company_id)
            .single();
          clientCompanyName = clientData?.name;
          clientEmail = clientData?.email;
        }

        // Envoyer l'email au prestataire
        if (userData?.email) {
          // Importer et appeler le service d'email de manière asynchrone (ne pas bloquer)
          import('@/services/emailService').then(({ sendJobAssignmentEmail }) => {
            sendJobAssignmentEmail(
              userData.email,
              providerData.name,
              {
                id: data.id,
                address: data.address,
                dateTime: parseDate(data.date_time),
                clientCompanyName,
              }
            ).catch((emailError) => {
              console.error('❌ Erreur lors de l\'envoi de l\'email au prestataire (non bloquant):', emailError);
            });
          });
        } else {
          console.warn('⚠️ Email du prestataire non trouvé, impossible d\'envoyer la notification');
        }

        // Envoyer l'email au client
        if (clientEmail && clientCompanyName) {
          console.log('📧 Envoi d\'email de notification d\'acceptation au client:', clientEmail);
          // Importer et appeler le service d'email de manière asynchrone (ne pas bloquer)
          setTimeout(async () => {
            try {
              const { sendJobAcceptedEmailToClient } = await import('@/services/emailService');
              await sendJobAcceptedEmailToClient(
                clientEmail!,
                clientCompanyName!,
                {
                  id: data.id,
                  address: data.address,
                  dateTime: parseDate(data.date_time),
                  providerName: providerData.name,
                  providerPhone: providerData.phone,
                }
              );
              console.log('✅ Email d\'acceptation envoyé au client avec succès');
            } catch (emailError: any) {
              console.error('❌ Erreur lors de l\'envoi de l\'email au client (non bloquant):', emailError);
            }
          }, 0);
        } else {
          console.warn('⚠️ Email du client non trouvé, impossible d\'envoyer la notification d\'acceptation');
          console.warn('   Client Company ID:', data.client_company_id);
          console.warn('   Client Email:', clientEmail);
          console.warn('   Client Name:', clientCompanyName);
        }
      }
    }

    return {
      id: data.id,
      clientCompanyId: data.client_company_id,
      providerId: data.provider_id || undefined,
      address: data.address,
      dateTime: parseDate(data.date_time),
      status: data.status,
      notes: data.notes || undefined,
      invoiceUrl: data.invoice_url || undefined,
      createdAt: parseDate(data.created_at),
      vehicles: [], // TODO: Charger les véhicules
    };
  },

  /**
   * Met à jour automatiquement les demandes expirées (date_time < now()) au statut 'completed'
   */
  async updateExpiredRequests(): Promise<void> {
    const { error } = await supabase
      .from('wash_requests')
      .update({ status: 'completed' })
      .lt('date_time', new Date().toISOString())
      .neq('status', 'completed');

    if (error) {
      console.error('❌ Erreur lors de la mise à jour des demandes expirées:', error);
      throw error;
    }
  },

  /**
   * Met à jour les demandes pending expirées (date_time < now() et status = 'pending') au statut 'cancelled'
   * pour un client spécifique
   */
  async updateExpiredPendingRequests(clientCompanyId: string): Promise<void> {
    const { error } = await supabase
      .from('wash_requests')
      .update({ status: 'cancelled' })
      .eq('client_company_id', clientCompanyId)
      .eq('status', 'pending')
      .lt('date_time', new Date().toISOString());

    if (error) {
      console.error('❌ Erreur lors de la mise à jour des demandes pending expirées:', error);
      throw error;
    }
  },

  /**
   * Met à jour les demandes acceptées expirées (date_time < now() et status = 'accepted') au statut 'completed'
   * pour un client spécifique
   */
  async updateExpiredAcceptedRequests(clientCompanyId: string): Promise<void> {
    const { error } = await supabase
      .from('wash_requests')
      .update({ status: 'completed' })
      .eq('client_company_id', clientCompanyId)
      .eq('status', 'accepted')
      .lt('date_time', new Date().toISOString());

    if (error) {
      console.error('❌ Erreur lors de la mise à jour des demandes acceptées expirées:', error);
      throw error;
    }
  },

  /**
   * Récupère les factures pour un client, groupées par date
   */
  async getInvoicesByClientCompanyId(clientCompanyId: string): Promise<WashRequest[]> {
    const { data, error } = await supabase
      .from('wash_requests')
      .select('*')
      .eq('client_company_id', clientCompanyId)
      .eq('status', 'completed')
      .not('invoice_url', 'is', null)
      .order('date_time', { ascending: false });

    if (error) throw error;

    // Charger les informations du prestataire pour chaque demande
    const requestsWithProvider = await Promise.all(
      data.map(async (wr) => {
        let provider = null;
        if (wr.provider_id) {
          try {
            const { data: providerData } = await supabase
              .from('providers')
              .select('*')
              .eq('id', wr.provider_id)
              .single();
            
            if (providerData) {
              provider = {
                id: providerData.id,
                userId: providerData.user_id,
                name: providerData.name,
                baseCity: providerData.base_city,
                radiusKm: providerData.radius_km,
                phone: providerData.phone,
                description: providerData.description,
                services: providerData.services,
              };
            }
          } catch (error) {
            console.warn('⚠️ Erreur lors du chargement du prestataire:', error);
          }
        }

        return {
          id: wr.id,
          clientCompanyId: wr.client_company_id,
          providerId: wr.provider_id || undefined,
          address: wr.address,
          dateTime: parseDate(wr.date_time),
          status: wr.status as WashRequestStatus,
          notes: wr.notes || undefined,
          invoiceUrl: wr.invoice_url || undefined,
          createdAt: parseDate(wr.created_at),
          vehicles: [],
          provider: provider || undefined,
        };
      })
    );

    return requestsWithProvider;
  },

  /**
   * Récupère les factures pour un prestataire, groupées par date
   */
  async getInvoicesByProviderId(providerId: string): Promise<WashRequest[]> {
    const { data, error } = await supabase
      .from('wash_requests')
      .select('*')
      .eq('provider_id', providerId)
      .eq('status', 'completed')
      .not('invoice_url', 'is', null)
      .order('date_time', { ascending: false });

    if (error) throw error;

    // Charger les informations du client pour chaque demande
    const requestsWithClient = await Promise.all(
      data.map(async (wr) => {
        let clientCompany = null;
        try {
          const { data: clientData } = await supabase
            .from('client_companies')
            .select('*')
            .eq('id', wr.client_company_id)
            .single();
          
          if (clientData) {
            clientCompany = {
              id: clientData.id,
              userId: clientData.user_id,
              name: clientData.name,
              address: clientData.address,
              contact: clientData.contact,
              phone: clientData.phone,
              email: clientData.email,
              avatarUrl: clientData.avatar_url || undefined,
            };
          }
        } catch (error) {
          console.warn('⚠️ Erreur lors du chargement du client:', error);
        }

        return {
          id: wr.id,
          clientCompanyId: wr.client_company_id,
          providerId: wr.provider_id || undefined,
          address: wr.address,
          dateTime: parseDate(wr.date_time),
          status: wr.status as WashRequestStatus,
          notes: wr.notes || undefined,
          invoiceUrl: wr.invoice_url || undefined,
          createdAt: parseDate(wr.created_at),
          vehicles: [],
          clientCompany: clientCompany || undefined,
        };
      })
    );

    return requestsWithClient;
  },

  /**
   * Enregistre qu'un provider a annulé une demande
   */
  async recordProviderCancellation(providerId: string, washRequestId: string): Promise<void> {
    const { error } = await supabase
      .from('provider_cancelled_requests')
      .upsert({
        provider_id: providerId,
        wash_request_id: washRequestId,
      }, {
        onConflict: 'provider_id,wash_request_id'
      });

    if (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'annulation:', error);
      throw error;
    }
  },

  /**
   * Récupère les IDs des demandes annulées par un provider
   */
  async getCancelledRequestIds(providerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('provider_cancelled_requests')
      .select('wash_request_id')
      .eq('provider_id', providerId);

    if (error) {
      console.error('❌ Erreur lors de la récupération des annulations:', error);
      throw error;
    }

    return (data || []).map((item: any) => item.wash_request_id);
  },
};

// ============================================
// VEHICLES
// ============================================

export const vehicleService = {
  /**
   * Crée un véhicule
   */
  async create(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    // Vérifier la session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }
    
    // Préparer les données à insérer
    const insertData: any = {
      client_company_id: data.clientCompanyId,
      license_plate: data.licensePlate,
      brand: data.brand,
      model: data.model,
      type: data.type,
    };
    
    // Ajouter year si présent
    if (data.year !== undefined) {
      insertData.year = data.year;
    }
    
    // Ajouter image_url si présent
    if (data.imageUrl) {
      insertData.image_url = data.imageUrl;
    }
    
    try {
      const { data: result, error } = await supabase
        .from('vehicles')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      if (!result) {
        throw new Error('Aucune donnée retournée après l\'insertion');
      }

      return {
        id: result.id,
        clientCompanyId: result.client_company_id,
        licensePlate: result.license_plate,
        brand: result.brand,
        model: result.model,
        type: result.type,
        year: result.year || undefined,
        imageUrl: result.image_url || undefined,
      };
    } catch (error: any) {
      console.error('❌ Exception dans vehicleService.create:', error);
      console.error('Type:', error?.constructor?.name);
      console.error('Stack:', error?.stack);
      throw error;
    }
  },

  /**
   * Récupère tous les véhicules d'une entreprise cliente
   */
  async getByClientCompanyId(clientCompanyId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('client_company_id', clientCompanyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((v) => ({
      id: v.id,
      clientCompanyId: v.client_company_id,
      licensePlate: v.license_plate,
      brand: v.brand,
      model: v.model,
      type: v.type,
      year: v.year || undefined,
      imageUrl: v.image_url || undefined,
    }));
  },

  /**
   * Récupère un véhicule par ID
   */
  async getById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      id: data.id,
      clientCompanyId: data.client_company_id,
      licensePlate: data.license_plate,
      brand: data.brand,
      model: data.model,
      type: data.type,
      year: data.year || undefined,
      imageUrl: data.image_url || undefined,
    };
  },

  /**
   * Met à jour un véhicule
   */
  async update(id: string, updates: Partial<Omit<Vehicle, 'id' | 'clientCompanyId'>>): Promise<Vehicle> {
    const updateData: any = {};
    if (updates.licensePlate) updateData.license_plate = updates.licensePlate;
    if (updates.brand) updateData.brand = updates.brand;
    if (updates.model) updateData.model = updates.model;
    if (updates.type) updateData.type = updates.type;
    if (updates.year !== undefined) updateData.year = updates.year;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      clientCompanyId: data.client_company_id,
      licensePlate: data.license_plate,
      brand: data.brand,
      model: data.model,
      type: data.type,
      year: data.year || undefined,
      imageUrl: data.image_url || undefined,
    };
  },

  /**
   * Supprime un véhicule
   */
  async delete(id: string): Promise<void> {
    console.log('🔧 vehicleService.delete appelé');
    console.log('ID du véhicule à supprimer:', id);
    
    // Vérifier la session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session:', session ? 'présente' : 'absente');
    if (session) {
      console.log('User ID de la session:', session.user.id);
    }
    
    try {
      console.log('Exécution de la requête DELETE...');
      const { data, error, count } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
        .select();

      console.log('Résultat DELETE - data:', data);
      console.log('Résultat DELETE - count:', count);
      console.log('Résultat DELETE - error:', error);

      if (error) {
        console.error('❌ Erreur vehicleService.delete:', error);
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        throw error;
      }
      
      // Vérifier que quelque chose a été supprimé
      if (!data || data.length === 0) {
        console.warn('⚠️ Aucune ligne supprimée - peut-être un problème RLS');
        // Vérifier si le véhicule existe toujours
        const stillExists = await this.getById(id);
        if (stillExists) {
          throw new Error('Le véhicule n\'a pas pu être supprimé. Vérifiez les politiques RLS.');
        }
      }
      
      console.log('✅ vehicleService.delete réussi');
    } catch (error: any) {
      console.error('❌ Exception dans vehicleService.delete:', error);
      console.error('Type:', error?.constructor?.name);
      console.error('Stack:', error?.stack);
      throw error;
    }
  },
};

