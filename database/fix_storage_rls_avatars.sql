-- ============================================
-- CORRECTION DES POLITIQUES RLS POUR LE BUCKET AVATARS
-- ============================================
-- Ce script corrige les politiques RLS pour permettre l'upload d'avatars
-- À exécuter dans l'éditeur SQL de Supabase
-- 
-- NOTE: RLS est déjà activé sur storage.objects par Supabase
-- On ne peut pas modifier directement cette table système

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Politique INSERT : Permettre aux utilisateurs authentifiés d'uploader dans leur propre dossier
-- Utilisation de starts_with pour vérifier que le chemin commence par l'ID utilisateur
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '/%' OR name = auth.uid()::text || '/')
);

-- Politique SELECT : Permettre à tous (public) de voir les avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Politique UPDATE : Permettre aux utilisateurs de mettre à jour leurs propres avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '/%' OR name = auth.uid()::text || '/')
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '/%' OR name = auth.uid()::text || '/')
);

-- Politique DELETE : Permettre aux utilisateurs de supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '/%' OR name = auth.uid()::text || '/')
);

