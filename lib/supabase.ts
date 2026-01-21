/**
 * Configuration Supabase
 * 
 * Ce fichier initialise la connexion à Supabase
 */

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Récupération des variables d'environnement
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                    process.env.EXPO_PUBLIC_SUPABASE_URL || 
                    'YOUR_SUPABASE_URL';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                        'YOUR_SUPABASE_ANON_KEY';

// Logs de débogage pour vérifier les variables
console.log('🔧 Configuration Supabase:');
console.log('URL:', supabaseUrl === 'YOUR_SUPABASE_URL' ? '❌ NON CONFIGURÉE' : '✅ ' + supabaseUrl.substring(0, 30) + '...');
console.log('Key:', supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY' ? '❌ NON CONFIGURÉE' : '✅ ' + supabaseAnonKey.substring(0, 20) + '...');

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ ERREUR: Supabase URL non configurée. Veuillez configurer EXPO_PUBLIC_SUPABASE_URL dans le fichier .env');
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ ERREUR: Supabase Anon Key non configurée. Veuillez configurer EXPO_PUBLIC_SUPABASE_ANON_KEY dans le fichier .env');
}

// Création du client Supabase avec Realtime activé
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: require('@react-native-async-storage/async-storage').default,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Types pour la base de données (générés automatiquement par Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: 'client' | 'provider' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role: 'client' | 'provider' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: 'client' | 'provider' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      client_companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string;
          contact: string;
          phone: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address: string;
          contact: string;
          phone: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string;
          contact?: string;
          phone?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      providers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          base_city: string;
          radius_km: number;
          phone: string;
          description: string | null;
          services: string[];
          average_rating: number;
          total_ratings: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          base_city: string;
          radius_km?: number;
          phone: string;
          description?: string | null;
          services?: string[];
          average_rating?: number;
          total_ratings?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          base_city?: string;
          radius_km?: number;
          phone?: string;
          description?: string | null;
          services?: string[];
          average_rating?: number;
          total_ratings?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      wash_requests: {
        Row: {
          id: string;
          client_company_id: string;
          provider_id: string | null;
          address: string;
          date_time: string;
          status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_company_id: string;
          provider_id?: string | null;
          address: string;
          date_time: string;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_company_id?: string;
          provider_id?: string | null;
          address?: string;
          date_time?: string;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

