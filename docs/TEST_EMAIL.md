# Guide de test de l'envoi d'email

## 🧪 Méthodes de test

Il existe plusieurs façons de tester l'envoi d'email via l'Edge Function Supabase :

### Méthode 1 : Via le Dashboard Supabase (Le plus simple)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** > **send-email**
4. Cliquez sur **Invoke function**
5. Utilisez ce JSON de test :

```json
{
  "to": "votre-email@example.com",
  "subject": "Test email depuis LMV",
  "html": "<h1>Test</h1><p>Ceci est un email de test.</p>",
  "text": "Test\n\nCeci est un email de test."
}
```

6. Cliquez sur **Invoke**
7. Vérifiez votre boîte email

### Méthode 2 : Via la console de l'application (Recommandé)

Dans la console de votre application (navigateur ou terminal), exécutez :

```javascript
// Importer la fonction de test
import { testEmailFunction } from '@/services/emailService';

// Tester l'envoi
await testEmailFunction('votre-email@example.com');
```

**Dans React Native / Expo :**
- Ouvrez la console de débogage
- Dans la console, tapez ou collez le code ci-dessus
- Appuyez sur Entrée

**Dans un navigateur (web) :**
- Ouvrez la console du navigateur (F12)
- Dans la console, tapez ou collez le code ci-dessus
- Appuyez sur Entrée

### Méthode 3 : Via un script Node.js (Recommandé pour les tests en ligne de commande)

**⚠️ Important** : Utilisez le script `test-email-standalone.ts` qui ne dépend pas de React Native.

```bash
# Installer dotenv si nécessaire (pour charger les variables d'environnement)
npm install --save-dev dotenv

# Exécuter le script de test standalone
npx tsx scripts/test-email-standalone.ts votre-email@example.com
```

**Configuration des variables d'environnement :**

Le script cherche les variables dans cet ordre :
1. Variables d'environnement du système
2. Fichier `.env` à la racine du projet
3. Fichier `.env.local` à la racine du projet

Créez un fichier `.env` à la racine avec :
```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

Ou passez-les directement :
```bash
EXPO_PUBLIC_SUPABASE_URL=https://... EXPO_PUBLIC_SUPABASE_ANON_KEY=... npx tsx scripts/test-email-standalone.ts votre-email@example.com
```

### Méthode 4 : Créer une page de test temporaire

Créez un fichier `app/test-email.tsx` :

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { testEmailFunction } from '@/services/emailService';

export default function TestEmailScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTest = async () => {
    if (!email) {
      setResult('❌ Veuillez entrer un email');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      await testEmailFunction(email);
      setResult('✅ Email envoyé avec succès ! Vérifiez votre boîte email.');
    } catch (error: any) {
      setResult(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test d'envoi d'email</Text>
      <TextInput
        style={styles.input}
        placeholder="votre-email@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        title={loading ? 'Envoi...' : 'Envoyer un email de test'}
        onPress={handleTest}
        disabled={loading}
      />
      {result && <Text style={styles.result}>{result}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  result: {
    marginTop: 20,
    fontSize: 16,
  },
});
```

Puis accédez à `http://localhost:8081/test-email` (ou votre URL locale).

## ✅ Vérifications après le test

1. **Vérifiez votre boîte email** (et le dossier spam)
2. **Vérifiez les logs** dans la console :
   - ✅ `Email envoyé avec succès` = Tout fonctionne
   - ❌ `Erreur lors de l'appel de l'Edge Function` = Vérifiez la configuration

## 🔍 Dépannage

### L'email n'est pas reçu

1. **Vérifiez le dossier spam**
2. **Vérifiez les logs** dans la console pour voir les erreurs
3. **Vérifiez Resend** : Allez sur https://resend.com/emails pour voir les emails envoyés
4. **Vérifiez les secrets Supabase** : `RESEND_API_KEY` et `EMAIL_FROM` doivent être configurés

### Erreur "Failed to send a request to the Edge Function"

- L'Edge Function n'est pas déployée
- Vérifiez dans Supabase Dashboard > Edge Functions

### Erreur "Missing RESEND_API_KEY"

- Le secret n'est pas configuré dans Supabase
- Allez dans Project Settings > Edge Functions > Secrets

### Erreur "Resend error" avec status 403

- Clé API invalide ou domaine non vérifié
- Vérifiez votre clé API dans Resend

## 📝 Note

Après avoir testé, vous pouvez supprimer la page de test ou le script si vous le souhaitez.

