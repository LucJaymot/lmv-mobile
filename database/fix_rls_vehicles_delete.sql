-- ============================================
-- AJOUT DE LA POLITIQUE RLS POUR DELETE SUR VEHICLES
-- ============================================
-- Ce script ajoute la politique RLS manquante pour permettre
-- la suppression des véhicules par les utilisateurs
-- À exécuter dans l'éditeur SQL de Supabase

-- Ajouter la politique DELETE pour vehicles
CREATE POLICY "Users can delete vehicles of own company" ON vehicles
  FOR DELETE USING (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
  );

