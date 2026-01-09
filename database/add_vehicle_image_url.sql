-- Ajouter les colonnes image_url et year à la table vehicles
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS year INTEGER;

