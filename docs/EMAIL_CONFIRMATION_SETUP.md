# Configuration de l'Email de Confirmation/Récapitulatif d'Inscription

Supabase permet de personnaliser les emails de confirmation directement depuis le dashboard. Voici comment configurer un email de récapitulatif lors de l'inscription.

## ⚠️ IMPORTANT : Activer l'envoi d'emails de confirmation

Par défaut, Supabase peut avoir la **confirmation d'email désactivée** (auto-confirm activé). Pour recevoir des emails de confirmation, vous devez :

### Étapes pour activer l'envoi d'emails :

1. **Accéder au Dashboard Supabase**
   - Connectez-vous à votre projet Supabase
   - Allez dans **Authentication** > **Settings** (ou **Configuration**)

2. **Activer l'envoi d'emails de confirmation**
   - Cherchez la section **"Email Auth"** ou **"Email Confirmation"**
   - Désactivez **"Enable email confirmations"** si vous voulez que les utilisateurs se connectent immédiatement
   - OU activez **"Enable email confirmations"** si vous voulez que les utilisateurs confirment leur email avant de se connecter
   - Pour recevoir des emails, vous devez soit activer la confirmation, soit configurer un template d'email de bienvenue

3. **Configurer un service d'email (si nécessaire)**
   - Par défaut, Supabase utilise son propre service d'email (limité en production)
   - Pour la production, configurez un service SMTP (SendGrid, Mailgun, etc.) dans **Authentication** > **Settings** > **SMTP Settings**

4. **Vérifier les emails de test**
   - Les emails peuvent arriver dans les spams
   - Vérifiez votre dossier spam/courrier indésirable
   - Pour les tests, utilisez des services comme Mailtrap ou vérifiez les logs Supabase

## Option 1 : Personnalisation du Template d'Email dans Supabase (Recommandé)

### Étapes :

1. **Accéder au Dashboard Supabase**
   - Connectez-vous à votre projet Supabase
   - Allez dans **Authentication** > **Email Templates**

2. **Personnaliser le Template "Confirm Signup"**
   - Sélectionnez le template "Confirm Signup"
   - Vous pouvez modifier le contenu HTML et le texte brut

### Exemple de Template Personnalisé avec Récapitulatif :

**Version HTML :**
```html
<h2>Bienvenue sur Lave ma voiture !</h2>

<p>Bonjour,</p>

<p>Merci de vous être inscrit sur notre plateforme. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>

<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>

<h3>Récapitulatif de votre inscription :</h3>
<ul>
  <li><strong>Email :</strong> {{ .Email }}</li>
  <li><strong>Date d'inscription :</strong> {{ .Token }}</li>
</ul>

<p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>

<p>Cordialement,<br>
L'équipe Lave ma voiture</p>
```

**Version Texte (Plain Text) :**
```
Bienvenue sur Lave ma voiture !

Bonjour,

Merci de vous être inscrit sur notre plateforme. Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :

{{ .ConfirmationURL }}

Récapitulatif de votre inscription :
- Email : {{ .Email }}
- Date d'inscription : {{ .Token }}

Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.

Cordialement,
L'équipe Lave ma voiture
```

### Variables Disponibles dans les Templates Supabase :

- `{{ .ConfirmationURL }}` - Lien de confirmation unique
- `{{ .Email }}` - Adresse email de l'utilisateur
- `{{ .Token }}` - Token de confirmation (peut être utilisé comme date)
- `{{ .SiteURL }}` - URL de votre site (définie dans Settings)

### Limitations :

⚠️ **Note importante** : Les templates d'email Supabase ne permettent pas d'inclure directement les données du profil (nom de l'entreprise, téléphone, etc.) car ces données sont créées après la confirmation de l'email.

## Option 2 : Edge Function pour Email Personnalisé (Avancé)

Si vous avez besoin d'inclure des données spécifiques du profil dans l'email, vous devrez créer une Edge Function Supabase.

### Étapes :

1. **Créer une Edge Function** dans votre projet Supabase
2. **Intégrer un service d'email** (Resend, SendGrid, etc.)
3. **Déclencher la fonction** après l'inscription réussie

### Exemple de Structure :

```typescript
// supabase/functions/send-welcome-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { email, role, profileData } = await req.json()
  
  // Envoyer l'email via Resend, SendGrid, etc.
  // Inclure les données du profil dans l'email
})
```

## Recommandation

Pour un récapitulatif simple, **Option 1** est la plus simple et suffisante. Elle utilise l'infrastructure native de Supabase et ne nécessite pas de configuration supplémentaire.

Pour un récapitulatif détaillé avec les données du profil, utilisez **Option 2** (nécessite un service d'email externe et une Edge Function).

