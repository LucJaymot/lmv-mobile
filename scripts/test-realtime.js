#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration Supabase Realtime
 * 
 * Usage: node scripts/test-realtime.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

console.log('🔍 Test de configuration Supabase Realtime...\n');

// Test 1: Vérifier la connexion
console.log('1️⃣ Test de connexion à Supabase...');
supabase.from('wash_requests').select('id').limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('   ❌ Erreur de connexion:', error.message);
      console.error('   💡 Vérifiez vos credentials Supabase');
      return;
    }
    console.log('   ✅ Connexion réussie\n');
    
    // Test 2: Vérifier Realtime
    console.log('2️⃣ Test d\'abonnement Realtime...');
    const channel = supabase
      .channel('test-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wash_requests',
        },
        (payload) => {
          console.log('   ✅ ✅ ✅ Événement Realtime reçu ! ✅ ✅ ✅');
          console.log('   📬 Payload:', JSON.stringify(payload, null, 2));
          process.exit(0);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('   ✅ Abonnement Realtime actif');
          console.log('   ⏳ En attente d\'un événement INSERT...');
          console.log('   💡 Créez une nouvelle demande depuis le web pour tester\n');
          
          // Attendre 30 secondes puis quitter
          setTimeout(() => {
            console.log('   ⏱️ Timeout après 30 secondes');
            console.log('   💡 Si aucun événement n\'a été reçu, vérifiez:');
            console.log('      1. Realtime est activé pour wash_requests dans Supabase Dashboard');
            console.log('      2. Les RLS permettent la lecture de la table');
            console.log('      3. Créez une nouvelle demande pour déclencher l\'événement');
            supabase.removeChannel(channel);
            process.exit(0);
          }, 30000);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('   ❌ Erreur d\'abonnement Realtime');
          if (err) {
            console.error('   ❌ Détails:', err);
          }
          console.error('   💡 Vérifiez que:');
          console.error('      1. Realtime est activé dans Supabase Dashboard > Database > Replication');
          console.error('      2. La table wash_requests est publiée pour Realtime');
          console.error('      3. Les RLS permettent la lecture');
          supabase.removeChannel(channel);
          process.exit(1);
        } else {
          console.log('   📡 Statut:', status);
        }
      });
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
