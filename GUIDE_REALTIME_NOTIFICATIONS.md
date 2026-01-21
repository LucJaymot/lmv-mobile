# Guide de Configuration des Notifications Realtime

Ce guide explique comment configurer Supabase Realtime pour recevoir des notifications lorsque de nouvelles demandes sont créées.

## 🔍 Diagnostic du Problème Actuel

Si vous ne recevez pas de notifications côté prestataire, vérifiez ces points :

### 1. ✅ Vérification dans Supabase Dashboard

#### Activer Realtime pour la table `wash_requests`

**Méthode 1 : Via SQL (Recommandé - Plus fiable)**

1. **Aller dans Supabase Dashboard** : https://supabase.com/dashboard
2. **SQL Editor** (dans le menu de gauche)
3. **Exécutez cette commande SQL** :

```sql
-- Activer Realtime pour la table wash_requests
ALTER PUBLICATION supabase_realtime ADD TABLE wash_requests;
```

4. **Vérifiez que c'est activé** :

```sql
-- Vérifier que la table est publiée pour Realtime
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'wash_requests';
```

Si vous voyez un résultat avec `wash_requests`, c'est activé ✅

**Méthode 2 : Via le Dashboard (selon votre version)**

L'emplacement peut varier selon votre version de Supabase :
- **Database > Replication** (certaines versions)
- **Database > Publications** (autres versions)
- **Database > ETL Replication** (versions récentes)

Si vous ne trouvez pas cette option, utilisez la **Méthode 1 (SQL)** qui fonctionne toujours.

#### Configurer les RLS (Row Level Security)

1. **Aller dans Authentication > Policies**
2. **Sélectionner la table `wash_requests`**
3. **Vérifier qu'il existe une policy SELECT** pour les prestataires

Exemple de policy nécessaire :
```sql
-- Policy pour permettre aux prestataires de lire les demandes pending
CREATE POLICY "Providers can read pending requests"
ON wash_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM providers
    WHERE providers.user_id = auth.uid()
  )
);
```

**Important** : Les prestataires doivent pouvoir **lire (SELECT)** la table pour que Realtime fonctionne, même s'ils n'ont pas besoin de modifier les données.

### 2. 🔍 Vérifications dans l'App Prestataire (Expo)

#### Logs à vérifier

Quand vous ouvrez l'app prestataire, vous devriez voir dans les logs :

```
👤 Prestataire connecté, configuration des notifications...
🔔 Initialisation de l'écoute Realtime...
🔔 Configuration de l'écoute Realtime pour les nouvelles demandes...
📡 Nom du canal: new-wash-requests-XXXXX
📡 ===== STATUT ABONNEMENT REALTIME =====
✅ ✅ ✅ Abonnement Realtime ACTIF et PRÊT ✅ ✅ ✅
```

#### Si vous voyez une erreur :

**Erreur "CHANNEL_ERROR"** :
- Vérifiez que Realtime est activé dans Supabase Dashboard
- Vérifiez votre connexion internet
- Vérifiez que les RLS permettent l'écoute

**Erreur "TIMED_OUT"** :
- Vérifiez votre connexion internet
- Vérifiez que Supabase est accessible

**Pas de message du tout** :
- Vérifiez que vous êtes bien connecté en tant que prestataire
- Vérifiez les logs au démarrage de l'app

### 3. 🔔 Notification de Test

Quand l'abonnement Realtime est actif, vous devriez recevoir automatiquement une notification de test après 2 secondes :

**Titre** : "🔔 Écoute Realtime active"  
**Message** : "Les notifications pour nouvelles demandes sont actives"

**Si vous ne recevez pas cette notification** :
- Les permissions de notification ne sont pas accordées
- Ouvrez les paramètres de l'appareil > Notifications > Votre App
- Activez les notifications

### 4. 📱 Test Complet

#### Test 1 : Vérifier l'écoute Realtime

1. **Ouvrez l'app prestataire sur Expo**
2. **Vérifiez les logs** - vous devriez voir `✅ ✅ ✅ Abonnement Realtime ACTIF et PRÊT ✅ ✅ ✅`
3. **Vérifiez que vous recevez la notification de test**

#### Test 2 : Créer une demande depuis le web

1. **Connectez-vous en tant que client sur le web**
2. **Créez une nouvelle demande**
3. **Vérifiez les logs côté prestataire (Expo)** - vous devriez voir :
   ```
   📬 ===== NOUVELLE DEMANDE DÉTECTÉE =====
   📬 Payload: {...}
   🔔 ===== CALLBACK NOUVELLE DEMANDE DÉCLENCHÉ =====
   📱 Affichage de la notification locale...
   ✅ ✅ ✅ Notification locale affichée avec succès ✅ ✅ ✅
   ```

#### Si vous ne voyez pas ces logs

1. **Vérifiez que Realtime est activé dans Supabase** (voir section 1)
2. **Vérifiez que les RLS permettent l'écoute** (voir section 1)
3. **Vérifiez que l'app prestataire est bien ouverte** (l'écoute s'arrête si l'app est fermée)

### 5. ⚙️ Configuration Supabase SQL

Si Realtime n'est pas activé, vous pouvez l'activer via SQL :

```sql
-- Activer la réplication (Realtime) pour la table wash_requests
ALTER PUBLICATION supabase_realtime ADD TABLE wash_requests;
```

**Ou via le Dashboard** :
1. Database > Replication
2. Trouvez `wash_requests` dans la liste
3. Activez le toggle "Enable Replication"

### 6. 🔒 Configuration RLS pour Realtime

**⚠️ IMPORTANT : Pour que Realtime fonctionne, les prestataires doivent pouvoir lire TOUTES les lignes de la table, pas seulement celles qui correspondent à un filtre.**

**Problème courant** : Si vous utilisez un filtre dans Realtime (comme `filter: 'status=eq.pending'`), les RLS doivent permettre la lecture de TOUTES les lignes, sinon les événements ne seront pas reçus.

Créez cette policy (elle permet la lecture de toutes les demandes aux prestataires) :

```sql
-- Permettre aux prestataires de lire TOUTES les demandes (nécessaire pour Realtime)
CREATE POLICY "Providers can read all wash_requests for realtime"
ON wash_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM providers
    WHERE providers.user_id = auth.uid()
  )
);
```

**Ou si vous voulez être plus restrictif**, vous pouvez permettre la lecture de toutes les demandes pending :

```sql
-- Alternative : Permettre aux prestataires de lire les demandes pending
CREATE POLICY "Providers can read pending wash_requests"
ON wash_requests FOR SELECT
TO authenticated
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM providers
    WHERE providers.user_id = auth.uid()
  )
);
```

**Note** : Si vous utilisez la deuxième policy, vous NE DEVEZ PAS utiliser de filtre dans Realtime (retirez `filter: 'status=eq.pending'`), sinon les événements ne seront pas reçus.

### 7. 🐛 Dépannage

#### Problème : Pas de notification reçue

**Checklist** :
- [ ] Realtime est activé pour `wash_requests` dans Supabase Dashboard
- [ ] Les RLS permettent aux prestataires de lire la table
- [ ] L'app prestataire est ouverte et connectée
- [ ] Les permissions de notification sont accordées
- [ ] Vous voyez `✅ ✅ ✅ Abonnement Realtime ACTIF` dans les logs
- [ ] Vous avez créé la demande avec le statut `pending`

#### Problème : Notification de test non reçue

- [ ] Permissions de notification accordées dans les paramètres de l'appareil
- [ ] L'app n'est pas en mode "Ne pas déranger"
- [ ] Les notifications système ne sont pas désactivées pour votre app

#### Problème : Realtime ne se connecte pas

- [ ] Vérifiez votre connexion internet
- [ ] Vérifiez que Supabase est accessible (testez l'URL)
- [ ] Vérifiez que votre compte prestataire est bien connecté
- [ ] Vérifiez les logs pour les erreurs spécifiques

## 📝 Notes Importantes

1. **Realtime nécessite une connexion active** : L'app prestataire doit être ouverte pour recevoir les notifications. Si l'app est fermée, aucune notification ne sera reçue (c'est normal pour les notifications locales).

2. **Les RLS sont critiques** : Même si les prestataires ne modifient pas la table, ils doivent avoir une policy SELECT pour écouter les événements Realtime.

3. **Testez toujours avec l'app ouverte** : Pour tester les notifications Realtime, l'app prestataire doit être ouverte et active.

4. **La notification de test** : Vous devriez recevoir une notification automatique 2 secondes après l'activation de Realtime. Si vous ne la recevez pas, vérifiez les permissions de notification.

## 🚀 Prochaines Étapes

Si après avoir suivi ce guide vous ne recevez toujours pas de notifications :

1. **Vérifiez les logs** dans l'app prestataire et partagez-les
2. **Vérifiez la configuration Supabase** et confirmez que Realtime est activé
3. **Testez avec la notification de test** pour vérifier que les notifications fonctionnent
