-- ============================================
-- FONCTION POUR CRÉER LES PROFILS (CONTOURNE RLS)
-- ============================================
-- Cette fonction permet de créer les profils client/provider
-- même sans session active, en contournant RLS
-- À exécuter dans l'éditeur SQL de Supabase

-- Fonction pour créer un profil client
CREATE OR REPLACE FUNCTION create_client_company_profile(
  p_user_id UUID,
  p_name TEXT,
  p_address TEXT,
  p_contact TEXT,
  p_phone TEXT,
  p_email TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  address TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER -- Permet de contourner RLS
AS $$
DECLARE
  v_company client_companies%ROWTYPE;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Insérer dans client_companies
  INSERT INTO client_companies (user_id, name, address, contact, phone, email)
  VALUES (p_user_id, p_name, p_address, p_contact, p_phone, p_email)
  RETURNING * INTO v_company;

  -- Retourner les données complètes
  RETURN QUERY SELECT 
    v_company.id,
    v_company.user_id,
    v_company.name,
    v_company.address,
    v_company.contact,
    v_company.phone,
    v_company.email,
    v_company.created_at,
    v_company.updated_at;
END;
$$;

-- Fonction pour créer un profil provider
CREATE OR REPLACE FUNCTION create_provider_profile(
  p_user_id UUID,
  p_name TEXT,
  p_base_city TEXT,
  p_radius_km INTEGER,
  p_phone TEXT,
  p_email TEXT,
  p_description TEXT DEFAULT NULL,
  p_services TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  base_city TEXT,
  radius_km INTEGER,
  phone TEXT,
  email TEXT,
  description TEXT,
  services TEXT[],
  average_rating DECIMAL(3,2),
  total_ratings INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER -- Permet de contourner RLS
AS $$
DECLARE
  v_provider providers%ROWTYPE;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Insérer dans providers
  INSERT INTO providers (
    user_id, 
    name, 
    base_city, 
    radius_km, 
    phone, 
    email, 
    description, 
    services,
    average_rating,
    total_ratings
  )
  VALUES (
    p_user_id, 
    p_name, 
    p_base_city, 
    p_radius_km, 
    p_phone, 
    p_email, 
    p_description, 
    p_services,
    0,
    0
  )
  RETURNING * INTO v_provider;

  -- Retourner les données complètes
  RETURN QUERY SELECT 
    v_provider.id,
    v_provider.user_id,
    v_provider.name,
    v_provider.base_city,
    v_provider.radius_km,
    v_provider.phone,
    v_provider.email,
    v_provider.description,
    v_provider.services,
    v_provider.average_rating,
    v_provider.total_ratings,
    v_provider.created_at,
    v_provider.updated_at;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_client_company_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_provider_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_client_company_profile TO anon;
GRANT EXECUTE ON FUNCTION create_provider_profile TO anon;

