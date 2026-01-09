-- ============================================
-- CORRECTION DES POLITIQUES RLS POUR LES PROFILS
-- ============================================
-- Ce script corrige les politiques RLS pour permettre la création des profils
-- lors de l'inscription (même sans session active)
-- À exécuter dans l'éditeur SQL de Supabase

-- Pour client_companies : permettre l'insertion si user_id correspond à auth.uid()
-- même si la session n'est pas encore active (cas de l'inscription)
DROP POLICY IF EXISTS "Users can insert own company" ON client_companies;

CREATE POLICY "Users can insert own company" ON client_companies
  FOR INSERT 
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id IN (SELECT id FROM auth.users WHERE id = user_id)
  );

-- Pour providers : même chose
DROP POLICY IF EXISTS "Users can insert own provider profile" ON providers;

CREATE POLICY "Users can insert own provider profile" ON providers
  FOR INSERT 
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id IN (SELECT id FROM auth.users WHERE id = user_id)
  );

-- Alternative : Si les politiques ci-dessus ne fonctionnent toujours pas,
-- vous pouvez temporairement désactiver RLS pour ces tables (POUR TEST UNIQUEMENT)
-- ALTER TABLE client_companies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE providers DISABLE ROW LEVEL SECURITY;

-- ⚠️ IMPORTANT : Réactivez RLS après les tests si vous l'avez désactivé :
-- ALTER TABLE client_companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

