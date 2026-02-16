# Guide de déploiement sur OVH - lavemavoiture.fr

Ce guide vous accompagne pour héberger la version web de WashFleet sur votre serveur OVH à l’adresse **lavemavoiture.fr**.

---

## Vue d’ensemble

Votre projet Expo dispose d’une version web. Le déploiement consiste à :
1. **Construire** la version web en production
2. **Uploader** les fichiers statiques sur le serveur OVH
3. **Configurer** le domaine et le routage SPA

> **Note** : Supabase reste hébergé sur leurs serveurs. OVH sert uniquement les fichiers statiques (HTML, JS, CSS, images).

---

## Prérequis

- Un hébergement OVH (mutualisé, VPS ou Web Cloud)
- Le domaine **lavemavoiture.fr** configuré et pointant vers votre serveur
- Accès SSH ou FTP au serveur
- Node.js installé localement pour la build

---

## Étape 1 : Préparer la configuration

### 1.1 Vérifier les variables d’environnement

Avant de builder, vérifiez votre fichier `.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-publique
EXPO_PUBLIC_CARSXE_API_KEY=votre-clé-carsxe
EXPO_PUBLIC_BRANDFETCH_CLIENT_ID=votre-id-brandfetch
```

Ces valeurs sont incluses dans le bundle au moment du build. Utilisez les clés de **production** Supabase.

### 1.2 Ajouter le domaine lavemavoiture.fr dans Supabase

1. Allez dans [Supabase Dashboard](https://supabase.com/dashboard) → votre projet
2. **Authentication** → **URL Configuration**
3. Ajoutez `https://lavemavoiture.fr` et `https://www.lavemavoiture.fr` dans **Redirect URLs**

---

## Étape 2 : Builder la version web

Depuis la racine du projet :

```bash
# Installer les dépendances
npm install

# Build de production pour le web
npm run build:web
```

La commande génère un dossier **`dist`** contenant :
- `index.html`
- Fichiers JS et CSS
- Images et assets
- `sw.js` (Service Worker pour le PWA)

---

## Étape 3 : Déployer sur OVH

### Option A : Hébergement mutualisé (FTP)

1. Connectez-vous via **FTP** ou **FileZilla** à votre espace OVH  
   - Hôte : `ftp.votredomaine.com` ou l’IP fournie par OVH  
   - Dossier : `www` ou `public_html`

2. **Uploader le contenu** du dossier `dist` (et non le dossier lui-même) dans la racine web.

3. Structure attendue à la racine :
   ```
   www/
   ├── index.html
   ├── _expo/
   ├── assets/
   ├── sw.js
   └── ...
   ```

4. **SPA :** ajoutez un fichier `.htaccess` à la racine pour le routage :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Option B : VPS (SSH + Nginx)

1. Copier les fichiers sur le serveur :

```bash
# Exemple avec SCP
scp -r dist/* utilisateur@votre-serveur:/var/www/lavemavoiture.fr/
```

2. Configurer Nginx pour le domaine et le routage SPA :

```nginx
server {
    listen 80;
    server_name lavemavoiture.fr www.lavemavoiture.fr;
    root /var/www/lavemavoiture.fr;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /sw.js {
        add_header Cache-Control "no-cache";
    }
}
```

3. Activer le site et recharger Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/lavemavoiture /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **HTTPS** (recommandé) avec Let’s Encrypt :

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d lavemavoiture.fr -d www.lavemavoiture.fr
```

---

## Étape 4 : Configuration DNS (si nécessaire)

Dans l’espace client OVH :

1. **Zone DNS** → lavemavoiture.fr  
2. Vérifier les enregistrements :
   - Type **A** : `@` et `www` → IP de votre serveur
   - Ou type **CNAME** : `www` → `lavemavoiture.fr`

La propagation peut prendre jusqu’à 24–48 h.

---

## Étape 5 : Vérifications post-déploiement

- [ ] https://lavemavoiture.fr s’affiche correctement
- [ ] Navigation entre les pages (SPA) fonctionne
- [ ] Connexion / inscription Supabase fonctionnent
- [ ] Les requêtes API vers Supabase fonctionnent (vérifier la console du navigateur)

---

## Redéploiement après mise à jour

1. Lancer un nouveau build : `npm run build:web`
2. Remplacer le contenu du dossier de déploiement par le contenu de `dist`
3. Vider le cache navigateur si besoin (Ctrl+Shift+R)

---

## Automatisation (optionnel)

Exemple de script de déploiement :

```bash
#!/bin/bash
# deploy-ovh.sh
set -e
npm run build:web
rsync -avz --delete dist/ utilisateur@votre-serveur:/var/www/lavemavoiture.fr/
```

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Page blanche | Vérifier la console du navigateur. S'assurer que le routage SPA est configuré (`.htaccess` ou Nginx) |
| Erreurs Supabase | Vérifier les Redirect URLs dans le dashboard Supabase et la configuration CORS |
| 404 sur les routes | Le routage SPA redirige mal vers `index.html` → vérifier `.htaccess` ou `try_files` |
| HTTPS non disponible | Configurer Let's Encrypt ou un certificat SSL dans le panneau OVH |

---

## Résumé des commandes

```bash
# Build
npm run build:web

# Test local avant déploiement
npx serve dist
# Puis ouvrir http://localhost:3000
```
