-- ============================================
-- VÉRIFICATION ET CORRECTION DU TRIGGER
-- ============================================
-- Ce script vérifie si le trigger existe et le crée/corrige si nécessaire
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si la fonction existe
SELECT EXISTS (
  SELECT 1 
  FROM pg_proc 
  WHERE proname = 'handle_new_user'
) AS function_exists;

-- 2. Vérifier si le trigger existe
SELECT EXISTS (
  SELECT 1 
  FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
) AS trigger_exists;

-- 3. Supprimer l'ancien trigger et la fonction s'ils existent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4. Créer la fonction avec les bonnes permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.encrypted_password, 'supabase_auth_managed'), -- Hash géré par Supabase Auth
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'client')
  )
  ON CONFLICT (id) DO NOTHING; -- Ne rien faire si l'utilisateur existe déjà
  RETURN NEW;
END;
$$;

-- 5. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Vérifier que tout est créé
SELECT 
  'Fonction créée' AS status,
  proname AS function_name
FROM pg_proc 
WHERE proname = 'handle_new_user';

SELECT 
  'Trigger créé' AS status,
  tgname AS trigger_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

