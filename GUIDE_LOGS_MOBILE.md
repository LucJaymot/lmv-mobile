# Guide : Voir les Logs de l'App Mobile Expo

Ce guide explique comment voir les logs de votre application Expo sur mobile.

## 📱 Méthodes selon votre Configuration

### Méthode 1 : Expo Go (Recommandé pour le développement)

Si vous utilisez **Expo Go** sur votre téléphone :

#### Sur iOS (iPhone/iPad)

1. **Ouvrez l'app Expo Go** sur votre iPhone
2. **Scannez le QR code** depuis votre terminal où `expo start` est lancé
3. **Les logs apparaissent automatiquement** dans le terminal où vous avez lancé `expo start`

#### Sur Android

1. **Ouvrez l'app Expo Go** sur votre téléphone Android
2. **Scannez le QR code** depuis votre terminal où `expo start` est lancé
3. **Les logs apparaissent automatiquement** dans le terminal où vous avez lancé `expo start`

#### Commandes utiles

```bash
# Démarrer Expo avec logs détaillés
npx expo start

# Filtrer les logs pour voir seulement vos messages
npx expo start | grep -E "(LOG|ERROR|WARN|🔔|📬|✅|❌)"

# Voir tous les logs (y compris React Native)
npx expo start --verbose
```

### Méthode 2 : Terminal avec Expo CLI

Quand vous lancez `npx expo start`, les logs apparaissent directement dans le terminal :

```bash
# Dans votre terminal
cd "/Users/lucjaymot/Desktop/lmv natively"
npx expo start
```

**Les logs de votre app mobile apparaîtront automatiquement** dans ce terminal quand vous utilisez Expo Go.

### Méthode 3 : Logs dans le Navigateur (Expo DevTools)

1. **Lancez Expo** : `npx expo start`
2. **Ouvrez votre navigateur** - Expo DevTools s'ouvre automatiquement (généralement sur http://localhost:19002)
3. **Cliquez sur "Logs"** dans le menu
4. **Tous les logs de l'app** s'affichent en temps réel

### Méthode 4 : React Native Debugger (Avancé)

Pour des logs plus détaillés :

1. **Installez React Native Debugger** (optionnel)
2. **Dans votre app**, secouez le téléphone (ou appuyez sur `Cmd+D` sur iOS, `Cmd+M` sur Android)
3. **Sélectionnez "Debug"**
4. **Ouvrez Chrome DevTools** sur `http://localhost:8081/debugger-ui/`
5. **Les logs apparaissent dans la console du navigateur**

### Méthode 5 : Logs Natifs (iOS/Android)

#### iOS (Simulateur ou Appareil)

```bash
# Voir les logs iOS en temps réel
npx react-native log-ios

# Ou avec Expo
npx expo run:ios
# Les logs apparaissent dans le terminal
```

#### Android (Émulateur ou Appareil)

```bash
# Voir les logs Android en temps réel
npx react-native log-android

# Ou avec Expo
npx expo run:android
# Les logs apparaissent dans le terminal

# Ou utiliser adb directement
adb logcat | grep ReactNativeJS
```

## 🔍 Filtrer les Logs pour Trouver vos Messages

### Filtrer par mots-clés

Dans votre terminal, utilisez `grep` pour filtrer :

```bash
# Voir seulement les logs de notifications
npx expo start | grep -E "(🔔|📬|📡|✅|❌|notification|Realtime)"

# Voir seulement les erreurs
npx expo start | grep ERROR

# Voir les logs de votre service de notifications
npx expo start | grep notificationService
```

### Utiliser les emojis comme filtres

Puisque j'ai ajouté des emojis dans les logs, vous pouvez facilement les filtrer :

```bash
# Voir les logs Realtime
npx expo start | grep "📡\|🔔\|📬"

# Voir les succès
npx expo start | grep "✅"

# Voir les erreurs
npx expo start | grep "❌"
```

## 📋 Logs Importants à Surveiller

Quand vous testez les notifications, cherchez ces messages :

### Au démarrage de l'app prestataire :

```
👤 Prestataire connecté, configuration des notifications...
🔔 Initialisation de l'écoute Realtime...
📡 ===== STATUT ABONNEMENT REALTIME =====
✅ ✅ ✅ Abonnement Realtime ACTIF et PRÊT ✅ ✅ ✅
```

### Quand une nouvelle demande est créée :

```
📬 ===== NOUVELLE DEMANDE DÉTECTÉE =====
📬 Payload: {...}
🔔 ===== CALLBACK NOUVELLE DEMANDE DÉCLENCHÉ =====
📱 Affichage de la notification locale...
✅ ✅ ✅ Notification locale affichée avec succès ✅ ✅ ✅
```

## 🛠️ Astuces de Débogage

### 1. Activer les logs détaillés

```bash
# Démarrer avec logs détaillés
EXPO_DEBUG=true npx expo start

# Ou
npx expo start --verbose
```

### 2. Sauvegarder les logs dans un fichier

```bash
# Sauvegarder tous les logs
npx expo start 2>&1 | tee logs.txt

# Filtrer et sauvegarder
npx expo start 2>&1 | grep -E "(🔔|📬|ERROR)" | tee logs-filtered.txt
```

### 3. Voir les logs en temps réel avec plusieurs terminaux

**Terminal 1** : Lancer Expo
```bash
npx expo start
```

**Terminal 2** : Filtrer les logs
```bash
# Suivre les logs iOS
tail -f ~/Library/Logs/CoreSimulator/*/system.log | grep ReactNativeJS

# Ou suivre les logs Android
adb logcat | grep ReactNativeJS
```

## 🐛 Problèmes Courants

### Les logs n'apparaissent pas

1. **Vérifiez que l'app est bien connectée** à Expo Go
2. **Vérifiez votre connexion réseau** (même WiFi pour Expo Go)
3. **Redémarrez Expo** : `Ctrl+C` puis `npx expo start` à nouveau

### Trop de logs / Logs confus

Utilisez les filtres :
```bash
npx expo start | grep -v "Bundled\|Web Bundled"
```

### Logs qui disparaissent trop vite

Sauvegardez-les dans un fichier :
```bash
npx expo start 2>&1 | tee logs.txt
```

## 📱 Sur l'Appareil Physique

### iOS

1. **Connectez votre iPhone** via USB
2. **Ouvrez Console.app** sur Mac
3. **Sélectionnez votre appareil** dans la liste
4. **Filtrez par "Expo"** ou "ReactNativeJS"

### Android

1. **Activez le débogage USB** sur votre téléphone
2. **Connectez via USB**
3. **Utilisez adb** :
```bash
adb logcat | grep ReactNativeJS
```

## 🎯 Pour Votre Cas Spécifique

Pour voir les logs des notifications Realtime :

```bash
# Dans votre terminal, lancez :
cd "/Users/lucjaymot/Desktop/lmv natively"
npx expo start | grep -E "(🔔|📬|📡|Realtime|notification)"
```

Ou simplement :
```bash
npx expo start
```

**Tous les logs apparaîtront automatiquement** quand vous utilisez Expo Go sur votre téléphone.

## 💡 Astuce Pro

Créez un alias dans votre `.zshrc` ou `.bashrc` :

```bash
# Ajouter à ~/.zshrc ou ~/.bashrc
alias expo-logs='npx expo start | grep -E "(🔔|📬|📡|✅|❌)"'
```

Puis utilisez simplement :
```bash
expo-logs
```
