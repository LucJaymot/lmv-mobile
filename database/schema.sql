-- ============================================
-- SCHEMA DE BASE DE DONNÉES - WashFleet
-- ============================================
-- Ce script crée toutes les tables nécessaires pour l'application
-- À exécuter dans l'éditeur SQL de Supabase

-- ============================================
-- 1. TABLE USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'provider', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. TABLE CLIENT_COMPANIES
-- ============================================
CREATE TABLE IF NOT EXISTS client_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour les recherches par user_id
CREATE INDEX IF NOT EXISTS idx_client_companies_user_id ON client_companies(user_id);

-- ============================================
-- 3. TABLE PROVIDERS
-- ============================================
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_city TEXT NOT NULL,
  radius_km INTEGER NOT NULL DEFAULT 20,
  phone TEXT NOT NULL,
  description TEXT,
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour les recherches par user_id et ville
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_base_city ON providers(base_city);

-- ============================================
-- 4. TABLE VEHICLES
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches par entreprise
CREATE INDEX IF NOT EXISTS idx_vehicles_client_company_id ON vehicles(client_company_id);

-- ============================================
-- 5. TABLE WASH_REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS wash_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_wash_requests_client_company_id ON wash_requests(client_company_id);
CREATE INDEX IF NOT EXISTS idx_wash_requests_provider_id ON wash_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_wash_requests_status ON wash_requests(status);
CREATE INDEX IF NOT EXISTS idx_wash_requests_date_time ON wash_requests(date_time);

-- ============================================
-- 6. TABLE WASH_REQUEST_VEHICLES
-- ============================================
CREATE TABLE IF NOT EXISTS wash_request_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wash_request_id UUID NOT NULL REFERENCES wash_requests(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('exterior', 'interior', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_wash_request_vehicles_wash_request_id ON wash_request_vehicles(wash_request_id);
CREATE INDEX IF NOT EXISTS idx_wash_request_vehicles_vehicle_id ON wash_request_vehicles(vehicle_id);

-- ============================================
-- 7. TABLE RATINGS
-- ============================================
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wash_request_id UUID NOT NULL REFERENCES wash_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  client_company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wash_request_id)
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_ratings_provider_id ON ratings(provider_id);
CREATE INDEX IF NOT EXISTS idx_ratings_client_company_id ON ratings(client_company_id);
CREATE INDEX IF NOT EXISTS idx_ratings_wash_request_id ON ratings(wash_request_id);

-- ============================================
-- 8. FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_companies_updated_at BEFORE UPDATE ON client_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wash_requests_updated_at BEFORE UPDATE ON wash_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour mettre à jour la note moyenne du prestataire
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers
  SET 
    total_ratings = (
      SELECT COUNT(*) FROM ratings WHERE provider_id = NEW.provider_id
    ),
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2) FROM ratings WHERE provider_id = NEW.provider_id
    )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour la note moyenne
CREATE TRIGGER update_provider_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_request_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Politiques pour users (lecture publique, écriture authentifiée)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Politiques pour client_companies
CREATE POLICY "Users can view own company" ON client_companies
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own company" ON client_companies
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own company" ON client_companies
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Politiques pour providers
CREATE POLICY "Providers are viewable by all" ON providers
  FOR SELECT USING (true);

CREATE POLICY "Users can view own provider profile" ON providers
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own provider profile" ON providers
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own provider profile" ON providers
  FOR UPDATE USING (user_id::text = auth.uid()::text);

-- Politiques pour vehicles
CREATE POLICY "Users can view vehicles of own company" ON vehicles
  FOR SELECT USING (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert vehicles for own company" ON vehicles
  FOR INSERT WITH CHECK (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update vehicles of own company" ON vehicles
  FOR UPDATE USING (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
  );

-- Politiques pour wash_requests
CREATE POLICY "Users can view own wash requests" ON wash_requests
  FOR SELECT USING (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
    OR provider_id IN (
      SELECT id FROM providers WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create wash requests for own company" ON wash_requests
  FOR INSERT WITH CHECK (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own wash requests" ON wash_requests
  FOR UPDATE USING (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
    OR provider_id IN (
      SELECT id FROM providers WHERE user_id::text = auth.uid()::text
    )
  );

-- Politiques pour wash_request_vehicles
CREATE POLICY "Users can view vehicles of own requests" ON wash_request_vehicles
  FOR SELECT USING (
    wash_request_id IN (
      SELECT id FROM wash_requests WHERE 
        client_company_id IN (
          SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
        )
        OR provider_id IN (
          SELECT id FROM providers WHERE user_id::text = auth.uid()::text
        )
    )
  );

CREATE POLICY "Users can insert vehicles for own requests" ON wash_request_vehicles
  FOR INSERT WITH CHECK (
    wash_request_id IN (
      SELECT id FROM wash_requests WHERE 
        client_company_id IN (
          SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
        )
    )
  );

-- Politiques pour ratings
CREATE POLICY "Users can view ratings" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings for own requests" ON ratings
  FOR INSERT WITH CHECK (
    client_company_id IN (
      SELECT id FROM client_companies WHERE user_id::text = auth.uid()::text
    )
  );

