-- ============================================
-- CORRECTION POLITIQUE RLS POUR PERMETTRE AUX PROVIDERS
-- DE VOIR LES CLIENT_COMPANIES ASSOCIÉS AUX DEMANDES
-- ============================================
-- Ce script ajoute une politique RLS pour permettre aux providers
-- de voir les client_companies associés aux wash_requests qu'ils peuvent voir
-- À exécuter dans l'éditeur SQL de Supabase

-- IMPORTANT: Exécuter d'abord fix_rls_provider_pending_requests.sql
-- pour permettre aux providers de voir les wash_requests pending

-- Fonction helper pour vérifier si un provider peut voir un client_company
-- Utilise SECURITY DEFINER pour contourner RLS lors de la vérification
CREATE OR REPLACE FUNCTION provider_can_view_client_company(
  p_client_company_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si l'utilisateur est un provider
  IF NOT EXISTS (
    SELECT 1 FROM providers WHERE user_id::text = p_user_id::text
  ) THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si le client_company est associé à une wash_request
  -- que le provider peut voir (pending sans provider OU assignée au provider)
  RETURN EXISTS (
    SELECT 1 FROM wash_requests wr
    WHERE wr.client_company_id = p_client_company_id
    AND (
      -- Wash request pending (sans provider) - tous les providers peuvent voir
      ( 
        wr.status = 'pending'
        AND wr.provider_id IS NULL
      )
      OR
      -- Wash request assignée au provider actuel
      (
        wr.provider_id IN (
          SELECT id FROM providers WHERE user_id::text = p_user_id::text
        )
      )
    )
  );
END;
$$;

-- Politique SELECT: Permettre aux providers de voir les client_companies
-- associés aux wash_requests qu'ils peuvent voir
DROP POLICY IF EXISTS "Providers can view client companies from requests" ON client_companies;
CREATE POLICY "Providers can view client companies from requests" ON client_companies
  FOR SELECT USING (
    provider_can_view_client_company(client_companies.id, auth.uid())
  );

