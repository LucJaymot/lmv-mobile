# Guide de déploiement de l'Edge Function send-email

## 📋 Prérequis

1. **Compte Resend** : Si vous n'en avez pas, créez-en un sur https://resend.com
2. **Supabase CLI** : Installé et configuré
3. **Clé API Resend** : À récupérer depuis votre dashboard Resend

## 🚀 Étapes de déploiement

### Étape 1 : Obtenir votre clé API Resend

1. Allez sur https://resend.com
2. Connectez-vous ou créez un compte
3. Allez dans **API Keys** (ou **Settings** > **API Keys**)
4. Cliquez sur **Create API Key**
5. Donnez un nom (ex: "LMV Production")
6. Copiez la clé API (elle commence par `re_...`)

⚠️ **Important** : Gardez cette clé secrète, ne la partagez jamais publiquement.

### Étape 2 : Vérifier votre domaine dans Resend (optionnel mais recommandé)

Pour envoyer des emails depuis votre propre domaine :

1. Dans Resend, allez dans **Domains**
2. Ajoutez votre domaine (ex: `votredomaine.com`)
3. Suivez les instructions pour configurer DNS (SPF, DKIM, DMARC)
4. Une fois vérifié, vous pourrez utiliser `noreply@votredomaine.com` comme expéditeur

**Pour les tests** : Resend fournit un domaine de test `onboarding@resend.dev` que vous pouvez utiliser temporairement.

### Étape 3 : Configurer les secrets dans Supabase

Vous avez deux options :

#### Option A : Via Supabase Dashboard (Recommandé pour débuter)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Project Settings** > **Edge Functions** > **Secrets**
4. Ajoutez les secrets suivants :
   - **Nom** : `RESEND_API_KEY`
   - **Valeur** : Votre clé API Resend (commence par `re_...`)
   - Cliquez sur **Add Secret**

5. Ajoutez également (optionnel) :
   - **Nom** : `EMAIL_FROM`
   - **Valeur** : L'adresse email d'expéditeur (ex: `Lave ma voiture <noreply@votredomaine.com>` ou `onboarding@resend.dev` pour les tests)
   - Cliquez sur **Add Secret**

#### Option B : Via Supabase CLI

```bash
# Se connecter à Supabase (si ce n'est pas déjà fait)
supabase login

# Lier votre projet local à votre projet Supabase
supabase link --project-ref votre-project-ref

# Configurer les secrets
supabase secrets set RESEND_API_KEY=votre_clé_api_resend
supabase secrets set EMAIL_FROM="Lave ma voiture <noreply@votredomaine.com>"
```

### Étape 4 : Déployer l'Edge Function

#### Via Supabase CLI (Recommandé)

```bash
# Assurez-vous d'être dans le répertoire racine du projet
cd /Users/lucjaymot/Desktop/lmv\ natively

# Vérifier que vous êtes bien lié au projet
supabase projects list

# Déployer la fonction
supabase functions deploy send-email
```

#### Via Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Edge Functions**
4. Cliquez sur **Deploy a new function**
5. Téléversez le dossier `supabase/functions/send-email` ou collez le code directement

### Étape 5 : Vérifier le déploiement

1. Dans Supabase Dashboard, allez dans **Edge Functions**
2. Vous devriez voir `send-email` dans la liste
3. Cliquez dessus pour voir les logs et les détails

### Étape 6 : Tester l'Edge Function

Vous pouvez tester directement depuis le Dashboard Supabase :

1. Allez dans **Edge Functions** > **send-email**
2. Cliquez sur **Invoke function**
3. Utilisez ce JSON de test :

```json
{
  "to": "votre-email@example.com",
  "subject": "Test email depuis LMV",
  "html": "<h1>Test</h1><p>Ceci est un email de test.</p>",
  "text": "Test\n\nCeci est un email de test."
}
```

4. Cliquez sur **Invoke**
5. Vérifiez votre boîte email

## 🔍 Vérification et dépannage

### Vérifier que la fonction est bien déployée

Dans les logs de votre application, vous devriez voir :
- ✅ `Email envoyé avec succès à [email]` au lieu de
- ❌ `⚠️ Edge Function non disponible`

### Erreurs courantes

#### 1. "Missing RESEND_API_KEY"
- **Cause** : Le secret n'a pas été configuré dans Supabase
- **Solution** : Vérifiez que `RESEND_API_KEY` est bien dans **Project Settings** > **Edge Functions** > **Secrets**

#### 2. "Resend error" avec status 403
- **Cause** : Clé API invalide ou domaine non vérifié
- **Solution** : Vérifiez votre clé API dans Resend et assurez-vous que le domaine est vérifié

#### 3. "Failed to send a request to the Edge Function"
- **Cause** : La fonction n'est pas déployée ou n'est pas accessible
- **Solution** : 
  - Vérifiez que la fonction est bien déployée dans Supabase Dashboard
  - Vérifiez que vous utilisez le bon `project_ref` dans votre configuration Supabase

#### 4. Les emails arrivent dans les spams
- **Cause** : Domaine non vérifié ou configuration DNS manquante
- **Solution** : 
  - Utilisez un domaine vérifié dans Resend
  - Configurez SPF, DKIM et DMARC pour votre domaine
  - Évitez les mots-clés spam dans le sujet

## 📝 Notes importantes

1. **Limites Resend** :
   - Plan gratuit : 100 emails/jour
   - Plan payant : selon votre abonnement

2. **Sécurité** :
   - Ne commitez jamais vos clés API dans Git
   - Utilisez toujours les secrets Supabase pour stocker les clés

3. **Production** :
   - Utilisez un domaine vérifié pour l'expéditeur
   - Configurez les enregistrements DNS correctement
   - Testez régulièrement l'envoi d'emails

## 🎯 Prochaines étapes

Une fois que l'Edge Function est déployée et testée :

1. Créez une nouvelle demande de lavage depuis l'application
2. Vérifiez les logs de la console pour voir si les emails sont envoyés
3. Vérifiez la boîte email des prestataires

Si tout fonctionne, vous devriez voir dans les logs :
```
✅ Email envoyé avec succès à [email-du-prestataire]
```

