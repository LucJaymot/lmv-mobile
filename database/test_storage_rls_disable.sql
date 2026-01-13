-- ============================================
-- ⚠️ SCRIPT DE TEST - DÉSACTIVER RLS TEMPORAIREMENT
-- ============================================
-- ⚠️ ATTENTION : Ce script désactive RLS uniquement pour tester
-- ⚠️ NE PAS UTILISER EN PRODUCTION
-- ⚠️ À utiliser uniquement pour diagnostiquer le problème
-- ⚠️ Réactiver RLS immédiatement après les tests
-- 
-- Ce script permet de vérifier si le problème vient des politiques RLS
-- ou d'un problème de transmission du token d'authentification

-- Vérifier l'état actuel de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS activé"
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- ⚠️ DÉSACTIVER RLS TEMPORAIREMENT (UNIQUEMENT POUR TEST)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ⚠️ APRÈS LES TESTS, RÉACTIVER RLS AVEC :
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- Puis réappliquer les politiques avec fix_storage_rls_avatars_mobile.sql

