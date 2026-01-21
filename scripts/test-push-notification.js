#!/usr/bin/env node

/**
 * Script de test pour envoyer des notifications push via l'API Expo
 * 
 * Usage:
 *   node scripts/test-push-notification.js <TOKEN> [TITLE] [BODY]
 * 
 * Exemple:
 *   node scripts/test-push-notification.js ExponentPushToken[xxxxx] "Test" "Message de test"
 */

const https = require('https');

// Récupérer les arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('❌ Usage: node scripts/test-push-notification.js <TOKEN> [TITLE] [BODY]');
  console.error('');
  console.error('Exemple:');
  console.error('  node scripts/test-push-notification.js ExponentPushToken[xxxxx] "Test" "Message de test"');
  process.exit(1);
}

const pushToken = args[0];
const title = args[1] || 'Test Notification';
const body = args[2] || 'Ceci est une notification de test';

// Vérifier que le token est valide
if (!pushToken.startsWith('ExponentPushToken[') || !pushToken.endsWith(']')) {
  console.error('❌ Format de token invalide. Le token doit commencer par "ExponentPushToken[" et se terminer par "]"');
  process.exit(1);
}

// Préparer le message
const message = {
  to: pushToken,
  sound: 'default',
  title: title,
  body: body,
  data: {
    test: true,
    timestamp: Date.now(),
  },
  priority: 'default',
  channelId: 'default',
};

// Convertir en JSON
const postData = JSON.stringify([message]);

// Options pour la requête HTTPS
const options = {
  hostname: 'exp.host',
  port: 443,
  path: '/--/api/v2/push/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  },
};

console.log('📤 Envoi de la notification...');
console.log('Token:', pushToken);
console.log('Titre:', title);
console.log('Message:', body);
console.log('');

// Effectuer la requête
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('✅ Notification envoyée avec succès!');
        console.log('');
        console.log('Réponse:', JSON.stringify(response, null, 2));
        
        // Vérifier les tickets
        if (response.data && response.data[0]) {
          const ticket = response.data[0];
          if (ticket.status === 'ok') {
            console.log('');
            console.log('🎉 La notification a été acceptée par Expo!');
            console.log('ID du ticket:', ticket.id);
          } else if (ticket.status === 'error') {
            console.error('');
            console.error('❌ Erreur lors de l\'envoi:');
            console.error('Message:', ticket.message);
            if (ticket.details) {
              console.error('Détails:', JSON.stringify(ticket.details, null, 2));
            }
          }
        }
      } else {
        console.error('❌ Erreur HTTP:', res.statusCode);
        console.error('Réponse:', data);
      }
    } catch (error) {
      console.error('❌ Erreur lors du parsing de la réponse:', error);
      console.error('Réponse brute:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur lors de la requête:', error);
  process.exit(1);
});

// Envoyer les données
req.write(postData);
req.end();
