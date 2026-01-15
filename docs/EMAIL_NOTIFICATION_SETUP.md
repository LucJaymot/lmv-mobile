# Configuration de l'envoi d'emails pour les notifications de jobs

## Vue d'ensemble

1. **Lorsqu'un prestataire accepte un nouveau job** : un email de notification lui est automatiquement envoyé avec les détails du job.
2. **Lorsqu'un client publie une demande** : tous les prestataires reçoivent un email les informant de la nouvelle demande disponible.

## Architecture

Le système utilise :
1. **Service d'email** (`services/emailService.ts`) : Gère l'envoi des emails
2. **Service de base de données** (`services/databaseService.ts`) : Détecte quand un job est assigné et déclenche l'envoi d'email
3. **Edge Function Supabase** (optionnel) : Pour envoyer les emails via un service externe

## Option 1 : Utiliser une Edge Function Supabase (Recommandé)

### Étapes pour créer l'Edge Function

1. **Installer Supabase CLI** (si ce n'est pas déjà fait)
   ```bash
   npm install -g supabase
   ```

2. **Initialiser Supabase dans le projet** (si ce n'est pas déjà fait)
   ```bash
   supabase init
   ```

3. **Créer l'Edge Function**
   ```bash
   supabase functions new send-email
   ```

4. **Configurer la fonction** (`supabase/functions/send-email/index.ts`)
   
   Exemple avec Resend (recommandé) :
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { Resend } from "https://esm.sh/resend@2.0.0"

   const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

   serve(async (req) => {
     try {
       const { to, subject, html, text } = await req.json()

       const { data, error } = await resend.emails.send({
         from: "Lave ma voiture <noreply@votredomaine.com>",
         to: [to],
         subject: subject,
         html: html,
         text: text,
       })

      if (error) {
        return new Response(JSON.stringify({ error }), { status: 400 })
      }

      return new Response(JSON.stringify({ data }), { status: 200 })
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  })
   ```

5. **Configurer les secrets**
   ```bash
   supabase secrets set RESEND_API_KEY=votre_clé_api_resend
   ```

6. **Déployer la fonction**
   ```bash
   supabase functions deploy send-email
   ```

### Alternatives à Resend

Vous pouvez utiliser d'autres services d'email :
- **SendGrid** : https://sendgrid.com
- **Mailgun** : https://mailgun.com
- **AWS SES** : https://aws.amazon.com/ses/
- **Postmark** : https://postmarkapp.com

## Option 2 : Utiliser directement un service d'email (Sans Edge Function)

Si vous préférez ne pas utiliser d'Edge Function, vous pouvez modifier `services/emailService.ts` pour appeler directement l'API du service d'email de votre choix.

### Exemple avec Resend (direct)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendJobAssignmentEmail(...) {
  await resend.emails.send({
    from: 'Lave ma voiture <noreply@votredomaine.com>',
    to: providerEmail,
    subject: emailSubject,
    html: emailBody.replace(/\n/g, '<br>'),
  });
}
```

**Note** : Cette approche nécessite d'installer le package du service d'email et de gérer la clé API côté client (moins sécurisé).

## Configuration actuelle

Par défaut, le système :
1. ✅ Détecte automatiquement quand un job est assigné à un prestataire
2. ✅ Récupère les informations du prestataire (nom, email)
3. ✅ Récupère les détails du job (adresse, date, client)
4. ✅ Prépare l'email avec toutes les informations
5. ⚠️ Tente d'appeler l'Edge Function `send-email` (si elle existe)
6. 📝 Log les détails de l'email dans la console (pour le développement)

## Test

Pour tester l'envoi d'email :

1. **Créer une demande de lavage** (côté client)
2. **Accepter la demande** (côté prestataire)
3. **Vérifier les logs** dans la console :
   - Vous devriez voir `📧 Envoi d'email de notification de job au prestataire:`
   - Si l'Edge Function est configurée, vous verrez `✅ Email envoyé avec succès`
   - Sinon, vous verrez un avertissement avec les instructions

## Contenu de l'email

L'email envoyé contient :
- **Sujet** : "Nouveau job assigné - [Adresse]"
- **Corps** :
  - Salutation personnalisée avec le nom du prestataire
  - Adresse du job
  - Date et heure du job
  - Nom du client (si disponible)
  - Message de clôture

## Personnalisation

Pour personnaliser le contenu de l'email, modifiez la fonction `sendJobAssignmentEmail` dans `services/emailService.ts`.

## Étape 0 : Créer les fonctions SQL nécessaires (IMPORTANT)

Avant de pouvoir envoyer des emails, vous devez créer deux fonctions SQL :

### 1. Fonction pour récupérer tous les prestataires (optionnel mais recommandé)

Si vous rencontrez des problèmes avec les politiques RLS qui empêchent de récupérer tous les prestataires :

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Exécutez le script : `database/get_all_providers_function.sql`
3. Cette fonction permet de récupérer tous les prestataires en contournant RLS

**Note** : Si la requête directe fonctionne (pas d'erreur RLS), cette fonction n'est pas nécessaire.

### 2. Fonction pour récupérer les emails (OBLIGATOIRE)

Pour récupérer les emails des prestataires depuis `auth.users` :

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Exécutez le script : `database/get_provider_emails_function.sql`
3. Cette fonction permet de récupérer les emails des prestataires depuis `auth.users`

**Sans cette fonction, les emails ne pourront pas être récupérés et aucun email ne sera envoyé.**

## Dépannage

### L'email n'est pas envoyé

1. **Vérifier les logs** : Regardez la console pour voir les messages d'erreur
   - Cherchez `📧 Envoi d'emails aux prestataires`
   - Vérifiez si vous voyez `⚠️ Aucun email trouvé pour les prestataires`
   
2. **Vérifier les fonctions SQL** : 
   - Assurez-vous que `get_provider_emails` existe dans Supabase (OBLIGATOIRE)
   - Assurez-vous que `get_all_providers` existe si vous avez des problèmes RLS (optionnel)
   - Exécutez les scripts SQL dans `database/` si nécessaire
   
3. **Vérifier les prestataires** :
   - Vérifiez les logs de la console pour voir combien de prestataires sont trouvés
   - Si `📋 0 prestataire(s) trouvé(s)`, vérifiez les politiques RLS ou exécutez `get_all_providers_function.sql`
   
3. **Vérifier l'Edge Function** : Assurez-vous qu'elle est déployée et fonctionne
4. **Vérifier les secrets** : Vérifiez que la clé API est bien configurée
5. **Vérifier les emails** : Assurez-vous que les prestataires ont bien un email dans `auth.users`

### L'email arrive dans les spams

- Configurez SPF, DKIM et DMARC pour votre domaine
- Utilisez un service d'email réputé (Resend, SendGrid, etc.)
- Évitez les mots-clés spam dans le sujet et le corps

