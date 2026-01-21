# Guide de Test des Notifications Push sur Expo

Ce guide vous explique comment tester les notifications push pour votre application Expo.

## 📋 Prérequis

1. **Expo CLI installé** : `npm install -g expo-cli`
2. **Compte Expo** : Créez un compte sur [expo.dev](https://expo.dev)
3. **Application Expo Go** installée sur votre téléphone (iOS ou Android)
4. **Plugin expo-notifications** : Déjà installé dans votre projet

## 🔧 Configuration

### 1. Configuration du projet

Le plugin `expo-notifications` a été ajouté dans `app.config.js`. Le `projectId` est automatiquement détecté, mais si vous rencontrez une erreur, voici comment le configurer :

#### Option 1 : Utiliser EAS (Recommandé)

Si vous utilisez EAS Build, le `projectId` est automatiquement détecté depuis votre configuration EAS.

#### Option 2 : Configurer manuellement

**Méthode A : Via variable d'environnement**

Ajoutez dans votre fichier `.env` :
```bash
EXPO_PROJECT_ID=votre-project-id
```

**Méthode B : Dans app.config.js**

Ajoutez dans la section `extra` de `app.config.js` :
```javascript
extra: {
  projectId: 'votre-project-id',
  // ... autres variables
}
```

**Pour obtenir votre `EXPO_PROJECT_ID` :**

1. Si vous utilisez EAS :
```bash
npx eas project:info
```

2. Si vous utilisez Expo Go ou un projet existant :
```bash
# Se connecter à Expo
npx expo login

# Obtenir les infos du projet
npx expo config --type public
```

3. Depuis votre compte Expo :
   - Allez sur [expo.dev](https://expo.dev)
   - Connectez-vous
   - Trouvez votre projet et copiez le `projectId` depuis l'URL ou les paramètres

**Note** : Si vous n'avez pas de `projectId`, vous pouvez créer un nouveau projet Expo :
```bash
npx expo init --template blank
# Ou utilisez votre projet existant
```

### 2. Rebuild de l'application

Après avoir modifié `app.config.js`, vous devez rebuilder l'application :

```bash
# Pour iOS
npx expo prebuild --clean
npx expo run:ios

# Pour Android
npx expo prebuild --clean
npx expo run:android
```

**Note** : Si vous utilisez Expo Go, vous n'avez pas besoin de rebuild, mais certaines fonctionnalités peuvent être limitées.

## 🧪 Méthodes de Test

### Méthode 1 : Écran de Test Intégré (Recommandé)

1. **Accéder à l'écran de test** :
   - Naviguez vers `/profile/test-notifications` dans votre application
   - Ou ajoutez un bouton dans votre écran de paramètres pour y accéder

2. **Tester les notifications locales** :
   - Cliquez sur "📱 Notification locale (immédiate)"
   - La notification devrait apparaître immédiatement

3. **Tester les notifications programmées** :
   - Cliquez sur "⏰ Notification programmée (5 secondes)"
   - Attendez 5 secondes, la notification apparaîtra

4. **Tester les notifications répétées** :
   - Cliquez sur "🔄 Notification répétée (toutes les minutes)"
   - La notification se répétera toutes les minutes

### Méthode 2 : Test via le Service de Notifications

Vous pouvez utiliser directement le service dans votre code :

```typescript
import { notificationService } from '@/services/notificationService';

// Enregistrer pour les notifications push
const token = await notificationService.registerForPushNotifications();

// Afficher une notification locale
await notificationService.showLocalNotification(
  'Titre',
  'Message de test',
  { customData: 'value' }
);
```

### Méthode 3 : Test avec Expo Push Notification Tool

1. **Obtenir le token Expo Push** :
   - Utilisez l'écran de test pour obtenir votre token
   - Ou appelez `notificationService.registerForPushNotifications()`

2. **Envoyer une notification via l'outil Expo** :
   - Allez sur [Expo Push Notification Tool](https://expo.dev/notifications)
   - Collez votre token
   - Remplissez le titre et le message
   - Cliquez sur "Send a Notification"

3. **Envoyer via cURL** :
```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
       "to": "ExponentPushToken[VOTRE_TOKEN]",
       "title": "Test Notification",
       "body": "Ceci est un test",
       "data": { "test": true }
     }'
```

### Méthode 4 : Test avec un Script Node.js

Créez un fichier `test-push.js` :

```javascript
const { Expo } = require('expo-server-sdk');

// Créez un client Expo
const expo = new Expo();

// Votre token Expo Push (obtenu depuis l'app)
const pushToken = 'ExponentPushToken[VOTRE_TOKEN]';

// Vérifier que le token est valide
if (!Expo.isExpoPushToken(pushToken)) {
  console.error('Token invalide:', pushToken);
  process.exit(1);
}

// Créer le message
const messages = [{
  to: pushToken,
  sound: 'default',
  title: 'Test Notification',
  body: 'Ceci est une notification de test depuis un script',
  data: { test: true, timestamp: Date.now() },
}];

// Envoyer les notifications
(async () => {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }
  
  console.log('Tickets:', tickets);
})();
```

Installez la dépendance :
```bash
npm install expo-server-sdk
```

Exécutez le script :
```bash
node test-push.js
```

## 📱 Test sur Différentes Plateformes

### iOS (Simulateur)

⚠️ **Important** : Les notifications push ne fonctionnent **PAS** sur le simulateur iOS. Vous devez tester sur un appareil physique.

Pour tester sur un appareil iOS :
1. Connectez votre iPhone via USB
2. Exécutez `npx expo run:ios --device`
3. Autorisez les notifications quand l'app le demande

### iOS (Appareil Physique)

1. **Configuration** :
   - Assurez-vous que votre compte Apple Developer est configuré
   - Les notifications push nécessitent un certificat APNs

2. **Test** :
   - Installez l'app sur votre iPhone
   - Autorisez les notifications
   - Testez avec l'écran de test ou l'outil Expo

### Android (Émulateur)

Les notifications fonctionnent sur l'émulateur Android, mais avec des limitations.

Pour tester :
```bash
npx expo run:android
```

### Android (Appareil Physique)

1. **Configuration** :
   - Connectez votre appareil Android via USB
   - Activez le mode développeur et le débogage USB

2. **Test** :
   - Exécutez `npx expo run:android`
   - Autorisez les notifications
   - Testez avec l'écran de test

## 🔍 Vérification et Débogage

### Vérifier les Permissions

```typescript
import * as Notifications from 'expo-notifications';

const { status } = await Notifications.getPermissionsAsync();
console.log('Statut des permissions:', status);
// 'granted' = autorisé
// 'denied' = refusé
// 'undetermined' = pas encore demandé
```

### Vérifier le Token

```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'votre-project-id',
});
console.log('Token:', tokenData.data);
```

### Écouter les Notifications

```typescript
// Notification reçue quand l'app est au premier plan
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification reçue:', notification);
});

// Notification cliquée
Notifications.addNotificationResponseReceivedListener(response => {
  console.log('Notification cliquée:', response);
});
```

### Logs de Débogage

Activez les logs détaillés :
```bash
# iOS
npx expo run:ios --device --verbose

# Android
npx expo run:android --verbose
```

## ⚠️ Problèmes Courants

### 1. "Permission refusée"

**Solution** :
- Allez dans les paramètres de l'appareil
- Trouvez votre application
- Activez les notifications manuellement

### 2. "Token non obtenu" ou "No projectId found"

**Solutions** :
- Vérifiez que `EXPO_PROJECT_ID` est correctement configuré (voir section Configuration)
- Assurez-vous d'être connecté à Expo : `npx expo login`
- Vérifiez votre connexion internet
- Si vous utilisez Expo Go, le `projectId` devrait être automatiquement détecté
- Si vous utilisez un build bare (après `expo prebuild`), vous devez configurer le `projectId` manuellement
- Vérifiez les logs de la console pour voir quelle méthode de détection du `projectId` est utilisée

### 3. "Notifications ne s'affichent pas"

**Solutions** :
- Vérifiez que les permissions sont accordées
- Vérifiez que l'app n'est pas en mode "Ne pas déranger"
- Sur iOS, assurez-vous que les notifications sont activées dans les paramètres système
- Vérifiez les logs pour voir s'il y a des erreurs

### 4. "Notifications fonctionnent en développement mais pas en production"

**Solutions** :
- Vérifiez que vous avez configuré les certificats APNs pour iOS
- Vérifiez que vous avez configuré Firebase Cloud Messaging pour Android
- Assurez-vous que votre build de production inclut les bonnes configurations

## 📚 Ressources Utiles

- [Documentation Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Guide des Permissions iOS](https://developer.apple.com/documentation/usernotifications)
- [Guide des Permissions Android](https://developer.android.com/training/notify-user/permissions)

## 🎯 Checklist de Test

- [ ] Plugin `expo-notifications` ajouté dans `app.config.js`
- [ ] `EXPO_PROJECT_ID` configuré
- [ ] Application rebuildée après modification de la config
- [ ] Permissions demandées et accordées
- [ ] Token Expo Push obtenu
- [ ] Notification locale testée (immédiate)
- [ ] Notification programmée testée
- [ ] Notification push testée depuis l'outil Expo
- [ ] Notification push testée depuis un script
- [ ] Écouteurs de notifications configurés
- [ ] Test sur appareil iOS (si applicable)
- [ ] Test sur appareil Android (si applicable)

## 🚀 Prochaines Étapes

Une fois les tests locaux réussis, vous pouvez :

1. **Intégrer avec votre backend** : Envoyer les tokens à votre serveur
2. **Configurer les notifications serveur** : Utiliser `expo-server-sdk` sur votre backend
3. **Gérer les notifications en arrière-plan** : Configurer les handlers pour les notifications reçues quand l'app est fermée
4. **Personnaliser les notifications** : Ajouter des icônes, sons, badges, etc.
