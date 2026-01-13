-- ============================================
-- ASSURER QUE LES POLITIQUES RLS SONT CRÉÉES
-- ============================================
-- Ce script garantit que les politiques RLS simplifiées sont en place
-- À exécuter dans l'éditeur SQL de Supabase
-- 
-- NOTE: RLS est déjà activé par défaut sur storage.objects
-- On ne peut pas modifier cette table système directement

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Créer les politiques simplifiées pour TEST
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Vérifier que les politiques ont été créées
SELECT 
    policyname,
    cmd as "Commande",
    roles,
    with_check as "Condition WITH CHECK"
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

