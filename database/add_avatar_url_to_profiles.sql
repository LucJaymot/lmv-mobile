-- Ajouter la colonne avatar_url aux tables client_companies et providers
-- Pour permettre le stockage de l'URL de la photo de profil

ALTER TABLE client_companies
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE providers
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN client_companies.avatar_url IS 'URL de la photo de profil de l''entreprise (stockée dans Supabase Storage)';
COMMENT ON COLUMN providers.avatar_url IS 'URL de la photo de profil du prestataire (stockée dans Supabase Storage)';

