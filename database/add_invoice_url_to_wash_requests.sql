-- ============================================
-- AJOUT DE LA COLONNE INVOICE_URL À WASH_REQUESTS
-- ============================================
-- Ce script ajoute une colonne pour stocker l'URL de la facture PDF
-- À exécuter dans l'éditeur SQL de Supabase

ALTER TABLE wash_requests 
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Commentaire pour la documentation
COMMENT ON COLUMN wash_requests.invoice_url IS 'URL de la facture PDF associée à la demande (stockée dans Supabase Storage)';

