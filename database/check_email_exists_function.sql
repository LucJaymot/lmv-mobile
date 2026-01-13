-- ============================================
-- FONCTION POUR VÉRIFIER SI UN EMAIL EXISTE
-- ============================================
-- Cette fonction permet de vérifier si un email existe dans auth.users
-- en contournant RLS pour la vérification de réinitialisation de mot de passe
-- À exécuter dans l'éditeur SQL de Supabase

-- Fonction pour vérifier si un email existe
CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  -- Vérifier si l'email existe dans auth.users
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE LOWER(email) = LOWER(p_email)
  );
END;
$$;

-- Donner les permissions nécessaires (anon pour permettre l'accès non authentifié)
GRANT EXECUTE ON FUNCTION check_email_exists TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_exists TO anon;

