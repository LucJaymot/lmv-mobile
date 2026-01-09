-- ============================================
-- TRIGGER POUR CRÉER AUTOMATIQUEMENT L'ENREGISTREMENT USER
-- ============================================
-- Ce trigger crée automatiquement un enregistrement dans la table users
-- lorsqu'un utilisateur est créé dans Supabase Auth (auth.users)
-- À exécuter dans l'éditeur SQL de Supabase

-- Fonction qui sera appelée par le trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, password_hash, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.encrypted_password, 'supabase_auth_managed'), -- Hash géré par Supabase Auth, stockage d'un placeholder
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::text
  )
  ON CONFLICT (id) DO NOTHING; -- Ne rien faire si l'utilisateur existe déjà
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui se déclenche après l'insertion dans auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Note: Cette fonction utilise SECURITY DEFINER, ce qui signifie qu'elle
-- s'exécute avec les privilèges du créateur de la fonction, contournant
-- ainsi les politiques RLS pour créer l'enregistrement initial.

