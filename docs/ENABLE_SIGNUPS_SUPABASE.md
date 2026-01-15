# Activer les inscriptions dans Supabase

## Erreur : "Signups not allowed for this instance"

Si vous recevez cette erreur lors de l'inscription, cela signifie que les inscriptions sont désactivées dans votre projet Supabase.

## Solution : Activer les inscriptions

### Étapes :

1. **Accéder au Dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Connectez-vous à votre compte
   - Sélectionnez votre projet

2. **Aller dans les paramètres d'authentification**
   - Dans le menu de gauche, cliquez sur **Authentication**
   - Cliquez sur **Settings** (ou **Configuration**)

3. **Activer les inscriptions**
   - Cherchez la section **"Auth Providers"** ou **"Email Auth"**
   - Cherchez l'option **"Enable sign ups"** ou **"Allow new user signups"**
   - **Activez cette option** (basculez le switch sur ON)

4. **Sauvegarder les modifications**
   - Les modifications sont généralement sauvegardées automatiquement
   - Si nécessaire, cliquez sur **"Save"** ou **"Update"**

5. **Tester l'inscription**
   - Retournez sur votre application
   - Essayez de créer un nouveau compte
   - L'inscription devrait maintenant fonctionner

## Note importante

Si vous désactivez les inscriptions pour des raisons de sécurité (par exemple, pour limiter l'accès à votre application), vous devrez créer les comptes manuellement depuis le Dashboard Supabase :

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **"Add user"** ou **"Invite user"**
3. Entrez l'email et le mot de passe
4. L'utilisateur recevra un email d'invitation (si configuré)

## Vérification

Pour vérifier que les inscriptions sont bien activées :

1. Dashboard Supabase > **Authentication** > **Settings**
2. Vérifiez que **"Enable sign ups"** est activé (ON)
3. Si c'est désactivé, activez-le et sauvegardez

