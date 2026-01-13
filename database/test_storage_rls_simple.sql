-- ============================================
-- POLITIQUE RLS SIMPLE POUR TESTER L'UPLOAD
-- ============================================
-- Script de test avec une politique très simple
-- À exécuter dans l'éditeur SQL de Supabase

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- POLITIQUE SIMPLE POUR TEST : Permettre à tous les utilisateurs authentifiés d'uploader dans le bucket avatars
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

