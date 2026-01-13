-- ============================================
-- RENDRE LE BUCKET "invoices" PUBLIC
-- ============================================
-- Ce script rend le bucket "invoices" public pour que les URLs publiques fonctionnent
-- À exécuter dans l'éditeur SQL de Supabase

-- Mettre à jour le bucket pour le rendre public
UPDATE storage.buckets
SET public = true
WHERE id = 'invoices';

-- Vérifier que le bucket est maintenant public
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'invoices';

