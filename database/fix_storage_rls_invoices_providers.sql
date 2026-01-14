-- ============================================
-- POLITIQUES RLS POUR LE BUCKET "invoices" - PRESTATAIRES
-- ============================================
-- Ce script ajoute les politiques RLS pour permettre aux prestataires
-- d'uploader et de gérer les factures pour les demandes où ils sont assignés
-- À exécuter dans l'éditeur SQL de Supabase
--
-- IMPORTANT : Ce script doit être exécuté APRÈS fix_storage_rls_invoices.sql

-- Politique INSERT: Les prestataires peuvent uploader des factures pour les demandes où ils sont assignés
CREATE POLICY "Providers can upload invoices for assigned requests" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'invoices'::text
    AND EXISTS (
      SELECT 1
      FROM wash_requests wr
      INNER JOIN providers p ON wr.provider_id = p.id
      WHERE p.user_id::text = auth.uid()::text
      AND storage.objects.name LIKE wr.id::text || '/%'
    )
  );

-- Politique UPDATE: Les prestataires peuvent mettre à jour les factures pour les demandes où ils sont assignés
CREATE POLICY "Providers can update invoices for assigned requests" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'invoices'::text
    AND EXISTS (
      SELECT 1
      FROM wash_requests wr
      INNER JOIN providers p ON wr.provider_id = p.id
      WHERE p.user_id::text = auth.uid()::text
      AND storage.objects.name LIKE wr.id::text || '/%'
    )
  )
  WITH CHECK (
    bucket_id = 'invoices'::text
    AND EXISTS (
      SELECT 1
      FROM wash_requests wr
      INNER JOIN providers p ON wr.provider_id = p.id
      WHERE p.user_id::text = auth.uid()::text
      AND storage.objects.name LIKE wr.id::text || '/%'
    )
  );

-- Politique DELETE: Les prestataires peuvent supprimer les factures pour les demandes où ils sont assignés
CREATE POLICY "Providers can delete invoices for assigned requests" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'invoices'::text
    AND EXISTS (
      SELECT 1
      FROM wash_requests wr
      INNER JOIN providers p ON wr.provider_id = p.id
      WHERE p.user_id::text = auth.uid()::text
      AND storage.objects.name LIKE wr.id::text || '/%'
    )
  );

