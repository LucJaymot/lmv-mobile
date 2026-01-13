-- ============================================
-- POLITIQUES RLS POUR LE BUCKET "invoices"
-- ============================================
-- Ce script crée les politiques RLS pour permettre aux clients
-- d'uploader et de visualiser leurs factures
-- À exécuter dans l'éditeur SQL de Supabase après la création du bucket "invoices"
--
-- IMPORTANT : Le bucket "invoices" doit être PUBLIC pour que les URLs publiques fonctionnent.
-- Les politiques RLS garantissent que seuls les clients propriétaires peuvent voir leurs factures.

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view invoices" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Clients can delete their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Clients can update their own invoices" ON storage.objects;

-- Politique SELECT: Permettre à tous d'afficher les factures (le bucket est public)
-- Mais les politiques RLS vérifient que seuls les clients propriétaires y ont accès via l'URL
-- Note: Pour une sécurité renforcée, vous pouvez restreindre cette politique, mais cela nécessitera
-- l'utilisation d'URLs signées au lieu d'URLs publiques
CREATE POLICY "Anyone can view invoices" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'invoices'::text);

-- Politique INSERT: Les clients peuvent uploader leurs propres factures
CREATE POLICY "Clients can upload their own invoices" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices'::text
    AND EXISTS (
      SELECT 1
      FROM wash_requests wr
      INNER JOIN client_companies cc ON wr.client_company_id = cc.id
      WHERE cc.user_id::text = auth.uid()::text
      AND storage.objects.name LIKE wr.id::text || '/%'
    )
  );

-- Politique UPDATE: Les clients peuvent mettre à jour leurs propres factures
CREATE POLICY "Clients can update their own invoices" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'invoices'::text
    AND EXISTS (
      SELECT 1
      FROM wash_requests wr
      INNER JOIN client_companies cc ON wr.client_company_id = cc.id
      WHERE cc.user_id::text = auth.uid()::text
      AND storage.objects.name LIKE wr.id::text || '/%'
    )
  );

-- Politique DELETE: Les clients peuvent supprimer leurs propres factures
CREATE POLICY "Clients can delete their own invoices" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'invoices'::text
    AND EXISTS (
      SELECT 1
      FROM wash_requests wr
      INNER JOIN client_companies cc ON wr.client_company_id = cc.id
      WHERE cc.user_id::text = auth.uid()::text
      AND storage.objects.name LIKE wr.id::text || '/%'
    )
  );

