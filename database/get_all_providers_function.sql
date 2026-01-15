-- ============================================
-- FONCTION POUR RÉCUPÉRER TOUS LES PRESTATAIRES
-- ============================================
-- Cette fonction récupère tous les prestataires en contournant RLS
-- Utile pour l'envoi d'emails aux prestataires lors de nouvelles demandes
-- À exécuter dans l'éditeur SQL de Supabase

CREATE OR REPLACE FUNCTION get_all_providers()
RETURNS TABLE (
  id UUID,
  name TEXT,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER -- Permet de contourner RLS
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::UUID,
    p.name::TEXT,
    p.user_id::UUID
  FROM providers p
  ORDER BY p.name;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_all_providers() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_providers() TO anon;

