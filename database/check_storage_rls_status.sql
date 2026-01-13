-- ============================================
-- VÉRIFICATION DES POLITIQUES RLS POUR STORAGE
-- ============================================
-- Script pour vérifier l'état actuel des politiques RLS sur storage.objects
-- À exécuter dans l'éditeur SQL de Supabase

-- Vérifier toutes les politiques existantes pour storage.objects
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
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Vérifier si RLS est activé sur storage.objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Vérifier les permissions sur le bucket avatars
SELECT 
    name,
    id,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'avatars';

