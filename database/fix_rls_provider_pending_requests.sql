-- ============================================
-- CORRECTION POLITIQUE RLS POUR PERMETTRE AUX PROVIDERS
-- DE VOIR ET ACCEPTER LES DEMANDES PENDING SANS PROVIDER ASSIGNÉ
-- ============================================
-- Ce script ajoute des politiques RLS pour permettre aux providers
-- de voir et accepter les demandes de lavage avec status='pending' et provider_id=NULL
-- À exécuter dans l'éditeur SQL de Supabase

-- Politique pour voir les demandes pending sans provider
DROP POLICY IF EXISTS "Providers can view pending requests without provider" ON wash_requests;

CREATE POLICY "Providers can view pending requests without provider" ON wash_requests
  FOR SELECT USING (
    status = 'pending' 
    AND provider_id IS NULL
    AND EXISTS (
      SELECT 1 FROM providers WHERE user_id::text = auth.uid()::text
    )
  );

-- Politique pour accepter (mettre à jour) les demandes pending sans provider
DROP POLICY IF EXISTS "Providers can accept pending requests" ON wash_requests;

CREATE POLICY "Providers can accept pending requests" ON wash_requests
  FOR UPDATE USING (
    status = 'pending' 
    AND provider_id IS NULL
    AND EXISTS (
      SELECT 1 FROM providers WHERE user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    status = 'accepted' 
    AND provider_id IN (
      SELECT id FROM providers WHERE user_id::text = auth.uid()::text
    )
  );

