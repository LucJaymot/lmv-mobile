-- Créer le bucket 'avatars' dans Supabase Storage
-- À exécuter dans l'éditeur SQL de Supabase (Storage > Buckets > Create Bucket)

-- Note: Ce script SQL ne peut pas créer directement un bucket via SQL standard.
-- Vous devez créer le bucket manuellement dans le dashboard Supabase:
-- 1. Allez dans Storage > Buckets
-- 2. Cliquez sur "New bucket"
-- 3. Nom: "avatars"
-- 4. Public: true (pour permettre l'accès aux images)
-- 5. File size limit: 5242880 (5MB)
-- 6. Allowed MIME types: image/png, image/jpeg, image/jpg
--    Note: image/jpg est accepté par Supabase même si image/jpeg est le standard

-- Politique RLS pour le bucket (à exécuter après la création du bucket)
-- NOTE: RLS est déjà activé sur storage.objects par Supabase
-- Permettre à tous les utilisateurs authentifiés d'uploader leurs propres avatars
-- Supprimer la politique si elle existe déjà
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;

CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre à tous les utilisateurs d'afficher les avatars (puisque le bucket est public)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permettre aux utilisateurs de mettre à jour leurs propres avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;

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

-- Permettre aux utilisateurs de supprimer leurs propres avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (name LIKE auth.uid()::text || '/%' OR name = auth.uid()::text || '/')
);

