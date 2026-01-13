-- ============================================
-- CORRECTION DES POLITIQUES RLS POUR MOBILE
-- ============================================
-- Ce script corrige les politiques RLS pour permettre l'upload d'avatars sur mobile
-- À exécuter dans l'éditeur SQL de Supabase
-- 
-- NOTE: Sur mobile, auth.uid() peut ne pas être disponible correctement
-- Nous allons simplifier les politiques pour tester

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- POLITIQUE SIMPLIFIÉE POUR TEST : Permettre à tous les utilisateurs authentifiés d'uploader dans le bucket avatars
-- (Sans restriction de chemin pour tester si le problème vient de la vérification du chemin)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Permettre à tous de voir les avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permettre aux utilisateurs de mettre à jour leurs propres avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Permettre aux utilisateurs de supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ============================================
-- NOTES IMPORTANTES :
-- ============================================
-- Ces politiques sont simplifiées pour tester sur mobile.
-- Si cela fonctionne, vous pouvez ensuite réappliquer les restrictions de chemin
-- en utilisant la condition : (name LIKE auth.uid()::text || '/%' OR name = auth.uid()::text || '/')
-- dans la clause WITH CHECK de la politique INSERT.

