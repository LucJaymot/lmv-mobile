# Correction de l'erreur d'inscription prestataire

## Problème

Lors de l'inscription d'un prestataire, une erreur affiche du HTML (template d'email) au lieu de créer le profil.

## Causes possibles

1. **La fonction SQL `create_provider_profile` n'existe pas** dans Supabase
2. **La fonction retourne du HTML** au lieu d'un résultat JSON
3. **Erreur de permissions** sur la fonction SQL
4. **Paramètres incorrects** passés à la fonction

## Solution

### Étape 1 : Vérifier que la fonction existe

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Exécutez cette requête :
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name = 'create_provider_profile';
   ```
3. Si aucun résultat, la fonction n'existe pas → passez à l'étape 2
4. Si la fonction existe, vérifiez ses paramètres → passez à l'étape 3

### Étape 2 : Créer la fonction SQL

Exécutez le script SQL suivant dans **Supabase Dashboard** > **SQL Editor** :

```sql
-- Fonction pour créer un profil prestataire
-- NOTE: La colonne email n'existe pas dans la table providers
-- L'email est stocké dans auth.users et récupéré via get_provider_emails()
CREATE OR REPLACE FUNCTION create_provider_profile(
  p_user_id UUID,
  p_name TEXT,
  p_base_city TEXT,
  p_radius_km INTEGER DEFAULT 20,
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
  v_provider providers%ROWTYPE;
BEGIN
  -- Vérifier que l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Insérer dans providers (sans email, car cette colonne n'existe pas)
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
  RETURNING * INTO v_provider;

  -- Retourner les données complètes (sans email)
  RETURN QUERY SELECT 
    v_provider.id,
    v_provider.user_id,
    v_provider.name,
    v_provider.base_city,
    v_provider.radius_km,
    v_provider.phone,
    v_provider.description,
    v_provider.services,
    v_provider.average_rating,
    v_provider.total_ratings,
    v_provider.created_at,
    v_provider.updated_at;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION create_provider_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_provider_profile TO anon;
```

### Étape 3 : Vérifier les permissions RLS

Assurez-vous que les politiques RLS permettent l'insertion :

```sql
-- Vérifier les politiques existantes
SELECT * FROM pg_policies WHERE tablename = 'providers';

-- Si nécessaire, créer/modifier la politique
DROP POLICY IF EXISTS "Users can insert own provider profile" ON providers;

CREATE POLICY "Users can insert own provider profile" ON providers
  FOR INSERT 
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id IN (SELECT id FROM auth.users WHERE id = user_id)
  );
```

### Étape 4 : Tester la fonction

Testez la fonction directement dans Supabase :

```sql
-- Remplacez les valeurs par des valeurs de test valides
SELECT * FROM create_provider_profile(
  '00000000-0000-0000-0000-000000000000'::UUID, -- user_id de test
  'Test Provider',
  'Paris',
  20,
  '0123456789',
  'test@example.com',
  'Description test',
  ARRAY['exterior', 'interior']::TEXT[]
);
```

Si cette requête retourne du HTML au lieu d'un résultat, il y a un problème de configuration Supabase.

## Vérifications supplémentaires

### Vérifier les logs Supabase

1. Allez dans **Supabase Dashboard** > **Logs** > **Postgres Logs**
2. Cherchez les erreurs liées à `create_provider_profile`
3. Vérifiez les messages d'erreur détaillés

### Vérifier la structure de la table providers

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'providers' 
ORDER BY ordinal_position;
```

Assurez-vous que toutes les colonnes nécessaires existent :
- `user_id` (UUID)
- `name` (TEXT)
- `base_city` (TEXT)
- `radius_km` (INTEGER)
- `phone` (TEXT)
- `email` (TEXT) - optionnel
- `description` (TEXT) - optionnel
- `services` (TEXT[])
- `average_rating` (DECIMAL)
- `total_ratings` (INTEGER)

## Solution alternative : Utiliser l'insertion directe

Si la fonction SQL pose problème, vous pouvez temporairement désactiver RLS pour les tests :

```sql
-- ⚠️ UNIQUEMENT POUR TESTS - Réactiver après
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
```

Puis réactivez après les tests :
```sql
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
```

## Contact

Si le problème persiste après avoir suivi ces étapes, vérifiez :
1. Les logs de la console du navigateur
2. Les logs Supabase (Postgres Logs)
3. La configuration RLS de la table `providers`

