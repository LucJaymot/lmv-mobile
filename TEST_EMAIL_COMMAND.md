# Commande de test d'email

## Commande à exécuter :

```bash
EXPO_PUBLIC_SUPABASE_URL=https://lbaxtqkpfjkcfdgvuqst.supabase.co EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_EX7lxj0Nr8oV0vPNocMimw_SYJlwymc npx tsx scripts/test-email-standalone.ts ljaymot@gmail.com
```

## Alternative : Créer un fichier .env

Créez un fichier `.env` à la racine du projet :

```bash
cat > .env << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://lbaxtqkpfjkcfdgvuqst.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_EX7lxj0Nr8oV0vPNocMimw_SYJlwymc
EOF
```

Puis exécutez simplement :

```bash
npx tsx scripts/test-email-standalone.ts ljaymot@gmail.com
```

## ⚠️ Note importante

Si la clé `sb_publishable_EX7lxj0Nr8oV0vPNocMimw_SYJlwymc` ne fonctionne pas, vous devez récupérer la **clé anon** depuis Supabase Dashboard :

1. Allez sur https://supabase.com/dashboard/project/lbaxtqkpfjkcfdgvuqst/settings/api
2. Copiez la clé **"anon public"** (elle commence généralement par `eyJhbGc...`)
3. Remplacez `sb_publishable_EX7lxj0Nr8oV0vPNocMimw_SYJlwymc` par cette clé dans la commande ci-dessus

