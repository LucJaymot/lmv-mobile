-- ============================================
-- CORRECTION DES POLITIQUES RLS POUR L'INSCRIPTION
-- ============================================
-- Ce script corrige les politiques RLS pour permettre l'inscription
-- À exécuter dans l'éditeur SQL de Supabase

-- Supprimer les anciennes politiques pour users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Créer les nouvelles politiques avec INSERT
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Note: Si cela ne fonctionne toujours pas, vous pouvez temporairement
-- désactiver RLS pour tester (NE PAS FAIRE EN PRODUCTION) :
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

