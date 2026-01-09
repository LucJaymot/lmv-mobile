-- ============================================
-- CORRECTION POLITIQUE RLS POUR LA SUPPRESSION DE DEMANDES DE LAVAGE
-- ============================================
-- Ce script ajoute la politique RLS manquante pour permettre la suppression
-- de demandes de lavage par les utilisateurs propriétaires de l'entreprise cliente.
-- À exécuter dans l'éditeur SQL de Supabase

DROP POLICY IF EXISTS "Users can delete own wash requests" ON wash_requests;

CREATE POLICY "Users can delete own wash requests" ON wash_requests
  FOR DELETE USING (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
  );

