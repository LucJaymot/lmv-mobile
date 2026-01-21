-- ============================================
-- FONCTION POUR CRÉER LES PROFILS (CONTOURNE RLS)
-- ============================================
-- Cette fonction permet de créer les profils client/provider
-- même sans session active, en contournant RLS
-- À exécuter dans l'éditeur SQL de Supabase

-- Supprimer toutes les versions existantes des fonctions
DO $$ 
DECLARE
    r RECORD;
    func_count INTEGER := 0;
BEGIN
    -- Supprimer toutes les fonctions create_client_company_profile
    FOR r IN (
        SELECT 
            p.oid::regprocedure as func_signature,
            p.proname as func_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'create_client_company_profile'
    ) 
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
            RAISE NOTICE 'Suppression de la fonction: %', r.func_signature;
            func_count := func_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors de la suppression de %: %', r.func_signature, SQLERRM;
        END;
    END LOOP;
    
    -- Supprimer toutes les fonctions create_provider_profile
    FOR r IN (
        SELECT 
            p.oid::regprocedure as func_signature,
            p.proname as func_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'create_provider_profile'
    ) 
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
            RAISE NOTICE 'Suppression de la fonction: %', r.func_signature;
            func_count := func_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur lors de la suppression de %: %', r.func_signature, SQLERRM;
        END;
    END LOOP;
    
    IF func_count = 0 THEN
        RAISE NOTICE 'Aucune fonction trouvée à supprimer';
    ELSE
        RAISE NOTICE 'Total de % fonction(s) supprimée(s)', func_count;
    END IF;
    
    -- Attendre un peu pour s'assurer que la suppression est complète
    PERFORM pg_sleep(0.1);
END $$;

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
  v_company_id UUID;
  v_result RECORD;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Insérer dans client_companies
  INSERT INTO client_companies (user_id, name, address, contact, phone, email)
  VALUES (p_user_id, p_name, p_address, p_contact, p_phone, p_email)
  RETURNING client_companies.id INTO v_company_id;

  -- Récupérer les données complètes dans un record pour éviter les ambiguïtés
  SELECT
    client_companies.id,
    client_companies.user_id,
    client_companies.name,
    client_companies.address,
    client_companies.contact,
    client_companies.phone,
    client_companies.email,
    client_companies.created_at,
    client_companies.updated_at
  INTO v_result
  FROM client_companies
  WHERE client_companies.id = v_company_id;

  -- Retourner le résultat en construisant explicitement chaque colonne
  RETURN QUERY SELECT
    v_result.id::UUID,
    v_result.user_id::UUID,
    v_result.name::TEXT,
    v_result.address::TEXT,
    v_result.contact::TEXT,
    v_result.phone::TEXT,
    v_result.email::TEXT,
    v_result.created_at::TIMESTAMP WITH TIME ZONE,
    v_result.updated_at::TIMESTAMP WITH TIME ZONE;
END;
$$;

-- Fonction pour créer un profil provider
CREATE OR REPLACE FUNCTION create_provider_profile(
  p_user_id UUID,
  p_name TEXT,
  p_base_city TEXT,
  p_radius_km INTEGER,
  p_phone TEXT,
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
  v_provider_id UUID;
  v_result RECORD;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Insérer dans providers (sans la colonne email qui n'existe pas)
  INSERT INTO providers (
    user_id, 
    name, 
    base_city, 
    radius_km, 
    phone, 
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
    p_description, 
    p_services,
    0,
    0
  )
  RETURNING providers.id INTO v_provider_id;

  -- Récupérer les données complètes dans un record pour éviter l'ambiguïté
  SELECT 
    providers.id,
    providers.user_id,
    providers.name,
    providers.base_city,
    providers.radius_km,
    providers.phone,
    providers.description,
    providers.services,
    providers.average_rating,
    providers.total_ratings,
    providers.created_at,
    providers.updated_at
  INTO v_result
  FROM providers
  WHERE providers.id = v_provider_id;

  -- Retourner le résultat en construisant explicitement chaque colonne
  RETURN QUERY SELECT 
    v_result.id::UUID,
    v_result.user_id::UUID,
    v_result.name::TEXT,
    v_result.base_city::TEXT,
    v_result.radius_km::INTEGER,
    v_result.phone::TEXT,
    v_result.description::TEXT,
    v_result.services::TEXT[],
    v_result.average_rating::DECIMAL(3,2),
    v_result.total_ratings::INTEGER,
    v_result.created_at::TIMESTAMP WITH TIME ZONE,
    v_result.updated_at::TIMESTAMP WITH TIME ZONE;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_client_company_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_provider_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_client_company_profile TO anon;
GRANT EXECUTE ON FUNCTION create_provider_profile TO anon;

