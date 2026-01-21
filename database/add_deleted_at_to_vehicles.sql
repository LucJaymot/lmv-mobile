-- ============================================
-- AJOUT DU CHAMP deleted_at POUR SOFT DELETE DES VÉHICULES
-- ============================================
-- Ce script ajoute un champ deleted_at à la table vehicles
-- pour permettre de conserver les véhicules dans les prestations terminées
-- même après leur suppression de la liste principale

-- Ajouter la colonne deleted_at si elle n'existe pas déjà
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Créer un index pour les recherches sur deleted_at
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at);

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN vehicles.deleted_at IS 'Date de suppression (soft delete). NULL si le véhicule est actif.';
