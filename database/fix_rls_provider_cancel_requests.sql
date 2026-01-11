-- ============================================
-- CORRECTION POLITIQUE RLS POUR PERMETTRE AUX PROVIDERS
-- D'ANNULER LES DEMANDES QU'ILS ONT ACCEPTÉES
-- ============================================
-- Ce script ajoute une politique RLS pour permettre aux providers
-- d'annuler les demandes qu'ils ont acceptées en les remettant à 'pending' avec provider_id=NULL
-- À exécuter dans l'éditeur SQL de Supabase

-- Politique pour annuler (mettre à jour) les demandes acceptées par le provider
DROP POLICY IF EXISTS "Providers can cancel accepted requests" ON wash_requests;

CREATE POLICY "Providers can cancel accepted requests" ON wash_requests
  FOR UPDATE USING (
    -- Le provider peut annuler une demande qu'il a acceptée
    status = 'accepted'
    AND provider_id IN (
      SELECT id FROM providers WHERE user_id::text = auth.uid()::text
    )
    AND EXISTS (
      SELECT 1 FROM providers WHERE user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    -- Après la mise à jour, la demande doit être en 'pending' avec provider_id=NULL
    status = 'pending'
    AND provider_id IS NULL
  );

