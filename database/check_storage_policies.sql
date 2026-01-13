-- ============================================
-- VÉRIFIER LES POLITIQUES RLS EXISTANTES
-- ============================================
-- Script pour vérifier quelles politiques RLS existent sur storage.objects
-- À exécuter dans l'éditeur SQL de Supabase

-- Lister toutes les politiques sur storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

