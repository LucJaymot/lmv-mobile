# Débogage : Email de confirmation non reçu

## Vérifications à faire

### 1. Vérifier les paramètres Supabase

1. **Accéder au Dashboard Supabase**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Vérifier les paramètres d'authentification**
   - Allez dans **Authentication** > **Settings**
   - Cherchez la section **"Email Auth"**
   - Vérifiez si **"Enable email confirmations"** est activé ou désactivé

### 2. Si "Enable email confirmations" est DÉSACTIVÉ (Auto-confirm activé)

**Problème** : Si cette option est désactivée, Supabase ne demande pas de confirmation d'email et l'utilisateur peut se connecter immédiatement. **Aucun email de confirmation n'est envoyé.**

**Solution** :
- Activez **"Enable email confirmations"** dans les paramètres Supabase
- Les nouveaux utilisateurs devront confirmer leur email avant de pouvoir se connecter
- Un email de confirmation sera automatiquement envoyé lors de l'inscription

### 3. Vérifier les logs de la console

Après une inscription, vérifiez les logs dans la console du navigateur :

```
📧 Configuration email:
emailRedirectTo: http://localhost:8081/auth/login
📧 Réponse Supabase Auth:
User confirmed: OUI ou NON
```

- Si **"User confirmed: OUI"** → L'utilisateur est déjà confirmé (auto-confirm activé), aucun email n'est envoyé
- Si **"User confirmed: NON"** → Un email devrait être envoyé (vérifiez les spams)

### 4. Vérifier le dossier spam

Les emails de Supabase peuvent être filtrés comme spam. Vérifiez :
- Le dossier **Spam** / **Courrier indésirable**
- Les emails de l'expéditeur `noreply@mail.app.supabase.io` ou similaire

### 5. Vérifier la configuration SMTP (pour la production)

Par défaut, Supabase utilise son propre service d'email (limité). Pour la production :

1. Allez dans **Authentication** > **Settings** > **SMTP Settings**
2. Configurez un service SMTP (SendGrid, Mailgun, Resend, etc.)
3. Testez l'envoi d'email

### 6. Vérifier les templates d'email

1. Allez dans **Authentication** > **Email Templates**
2. Vérifiez que le template **"Confirm Signup"** est configuré
3. Vous pouvez personnaliser le contenu de l'email ici

### 7. Tester avec un autre email

Essayez de vous inscrire avec un autre email pour vérifier si le problème est spécifique à un email ou général.

### 8. Vérifier les logs Supabase

Dans le Dashboard Supabase :
- Allez dans **Logs** > **Auth Logs**
- Vérifiez si des erreurs d'envoi d'email apparaissent

## Bug corrigé : Redirection après clic sur le lien

Si le lien de confirmation fonctionne mais que l'utilisateur reste sur la page de connexion sans être connecté :

**Cause** : La page de login ne traitait pas le hash `#access_token=...&type=signup` présent dans l'URL après le clic.

**Correction** : La page `/auth/login` traite maintenant explicitement ce hash et crée la session automatiquement.

**À vérifier** : Dans Supabase > Authentication > URL Configuration > Redirect URLs, ajoutez :
- `https://lavemavoiture.fr/auth/login` (production)
- `http://localhost:8081/auth/login` (développement)

Pour forcer l'URL de redirection en production, ajoutez dans `.env` :
```
EXPO_PUBLIC_APP_URL=https://lavemavoiture.fr
```

## Solutions rapides

### Solution 1 : Activer la confirmation d'email (Recommandé)

1. Dashboard Supabase > **Authentication** > **Settings**
2. Activez **"Enable email confirmations"**
3. Testez une nouvelle inscription

### Solution 2 : Configurer un template d'email de bienvenue

Même si auto-confirm est activé, vous pouvez configurer un email de bienvenue :

1. Dashboard Supabase > **Authentication** > **Email Templates**
2. Modifiez le template **"Welcome"** ou **"Confirm Signup"**
3. Les utilisateurs recevront cet email même en mode auto-confirm

### Solution 3 : Utiliser une Edge Function (Avancé)

Créez une Edge Function qui envoie un email personnalisé après l'inscription, indépendamment des paramètres Supabase.

## Code ajouté pour le débogage

Le code a été modifié pour afficher plus d'informations dans la console :
- Statut de confirmation de l'utilisateur
- URL de redirection configurée
- Détails de la réponse Supabase

Vérifiez ces logs après chaque inscription pour diagnostiquer le problème.

