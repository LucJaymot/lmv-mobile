-- ============================================
-- TABLE POUR SUIVRE LES ANNULATIONS DE DEMANDES PAR LES PROVIDERS
-- ============================================
-- Cette table permet de tracker quels providers ont annulé quelles demandes
-- pour afficher ces demandes avec le statut "annulé" uniquement pour ces providers
-- À exécuter dans l'éditeur SQL de Supabase

-- Créer la table provider_cancelled_requests
CREATE TABLE IF NOT EXISTS provider_cancelled_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  wash_request_id UUID NOT NULL REFERENCES wash_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, wash_request_id) -- Un provider ne peut annuler une demande qu'une seule fois
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_provider_cancelled_requests_provider_id ON provider_cancelled_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_cancelled_requests_wash_request_id ON provider_cancelled_requests(wash_request_id);

-- Activer RLS
ALTER TABLE provider_cancelled_requests ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Les providers peuvent voir leurs propres annulations
CREATE POLICY "Providers can view own cancellations" ON provider_cancelled_requests
  FOR SELECT USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id::text = auth.uid()::text
    )
  );

-- Politique INSERT: Les providers peuvent créer leurs propres annulations
CREATE POLICY "Providers can insert own cancellations" ON provider_cancelled_requests
  FOR INSERT WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE user_id::text = auth.uid()::text
    )
  );

-- Politique DELETE: Les providers peuvent supprimer leurs propres annulations (pour réactiver une demande par exemple)
CREATE POLICY "Providers can delete own cancellations" ON provider_cancelled_requests
  FOR DELETE USING (
    provider_id IN (
      SELECT id FROM providers WHERE user_id::text = auth.uid()::text
    )
  );

