-- ============================================
-- Ajout des colonnes de notification dans la table users
-- ============================================
-- Ce script ajoute les colonnes nécessaires pour stocker les tokens de notification push
-- des utilisateurs (prestataires et clients)

-- Ajouter la colonne notification_token (TEXT, nullable)
-- Stocke le token Expo Push Notification
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS notification_token TEXT;

-- Ajouter la colonne notification_token_updated_at (TIMESTAMP, nullable)
-- Stocke la date de dernière mise à jour du token
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS notification_token_updated_at TIMESTAMPTZ;

-- Ajouter un index sur notification_token pour améliorer les performances
-- des requêtes qui cherchent les utilisateurs par token
CREATE INDEX IF NOT EXISTS idx_users_notification_token 
ON public.users(notification_token) 
WHERE notification_token IS NOT NULL;

-- Ajouter un commentaire sur les colonnes pour la documentation
COMMENT ON COLUMN public.users.notification_token IS 'Token Expo Push Notification pour recevoir les notifications push';
COMMENT ON COLUMN public.users.notification_token_updated_at IS 'Date de dernière mise à jour du token de notification';

-- ============================================
-- Vérification
-- ============================================
-- Pour vérifier que les colonnes ont été ajoutées, exécutez :
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'users' 
-- AND column_name LIKE 'notification%';

