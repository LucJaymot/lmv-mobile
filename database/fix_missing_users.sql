-- ============================================
-- CORRECTION DES UTILISATEURS MANQUANTS
-- ============================================
-- Ce script crée les enregistrements manquants dans la table users
-- pour les utilisateurs qui existent dans auth.users mais pas dans users
-- À exécuter dans l'éditeur SQL de Supabase

-- Créer les enregistrements manquants dans users
INSERT INTO public.users (id, email, password_hash, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.encrypted_password, 'supabase_auth_managed'),
  COALESCE((au.raw_user_meta_data->>'role')::text, 'client')
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Vérifier le résultat
SELECT 
  COUNT(*) as users_fixed
FROM auth.users au
INNER JOIN public.users u ON au.id = u.id;

-- Voir les utilisateurs maintenant synchronisés
SELECT 
  au.id,
  au.email,
  u.email as users_email,
  u.role
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;

