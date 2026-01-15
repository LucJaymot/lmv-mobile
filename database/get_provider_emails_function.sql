-- ============================================
-- FONCTION POUR RÉCUPÉRER LES EMAILS DES PRESTATAIRES
-- ============================================
-- Cette fonction récupère les emails depuis auth.users
-- pour les prestataires dont les user_id sont fournis
-- À exécuter dans l'éditeur SQL de Supabase

CREATE OR REPLACE FUNCTION get_provider_emails(provider_user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Permet d'accéder à auth.users
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::UUID as user_id,
    au.email::TEXT as email
  FROM auth.users au
  WHERE au.id::UUID = ANY(provider_user_ids);
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_provider_emails TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_emails TO anon;

