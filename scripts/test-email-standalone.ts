/**
 * Script de test standalone pour l'envoi d'email via l'Edge Function Supabase
 * 
 * Ce script fonctionne indépendamment de React Native/Expo
 * 
 * Usage:
 *   npx tsx scripts/test-email-standalone.ts votre-email@example.com
 * 
 * Ou avec Node.js:
 *   node -r ts-node/register scripts/test-email-standalone.ts votre-email@example.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env si disponible
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Récupérer les variables d'environnement
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                    process.env.SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL ||
                    'YOUR_SUPABASE_URL';

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                        'YOUR_SUPABASE_ANON_KEY';

// Vérifier que les variables sont configurées
if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ ERREUR: Supabase URL non configurée');
  console.error('');
  console.error('💡 Configurez une de ces variables d\'environnement:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('');
  console.error('Ou créez un fichier .env à la racine du projet avec:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon');
  process.exit(1);
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('❌ ERREUR: Supabase Anon Key non configurée');
  console.error('');
  console.error('💡 Configurez une de ces variables d\'environnement:');
  console.error('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   - SUPABASE_ANON_KEY');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('');
  console.error('Ou créez un fichier .env à la racine du projet avec:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon');
  process.exit(1);
}

// Créer le client Supabase (sans dépendances React Native)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmail(to: string) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TEST D\'ENVOI D\'EMAIL VIA EDGE FUNCTION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📧 Email destinataire: ${to}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log('');

  const emailSubject = 'Test email - Lave ma voiture';
  const emailBody = `
Bonjour,

Ceci est un email de test pour vérifier que l'Edge Function send-email fonctionne correctement.

Si vous recevez cet email, cela signifie que :
✅ L'Edge Function est bien déployée
✅ Resend est correctement configuré
✅ Les secrets Supabase sont bien définis

Cordialement,
L'équipe Lave ma voiture
  `.trim();

  try {
    console.log('📤 Envoi de la requête à l\'Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: to,
        subject: emailSubject,
        html: emailBody.replace(/\n/g, '<br>'),
        text: emailBody,
      },
    });

    if (error) {
      console.error('❌ Erreur lors de l\'appel de l\'Edge Function:');
      console.error('   Code:', error.code || 'N/A');
      console.error('   Message:', error.message || 'N/A');
      console.error('   Détails:', JSON.stringify(error, null, 2));
      console.error('');
      console.error('💡 Vérifications à faire:');
      console.error('   1. L\'Edge Function est-elle déployée ? (Supabase Dashboard > Edge Functions)');
      console.error('   2. Les secrets sont-ils configurés ? (RESEND_API_KEY, EMAIL_FROM)');
      console.error('   3. Votre clé API Resend est-elle valide ?');
      console.error('   4. Vérifiez les logs de l\'Edge Function dans Supabase Dashboard');
      process.exit(1);
    }

    if (data) {
      console.log('✅ Réponse de l\'Edge Function:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      
      if (data.ok || data.result) {
        console.log('✅ Email envoyé avec succès !');
        console.log(`📧 Vérifiez votre boîte email: ${to}`);
        console.log('   (Vérifiez aussi le dossier spam si nécessaire)');
        console.log('');
        console.log('💡 Vous pouvez aussi vérifier dans Resend Dashboard:');
        console.log('   https://resend.com/emails');
      } else if (data.error) {
        console.error('❌ Erreur retournée par l\'Edge Function:');
        console.error(JSON.stringify(data.error, null, 2));
        process.exit(1);
      }
    } else {
      console.warn('⚠️ Aucune donnée retournée par l\'Edge Function');
      console.warn('   Mais l\'appel a réussi, l\'email devrait être envoyé');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TEST TERMINÉ');
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error: any) {
    console.error('❌ Erreur lors du test:');
    console.error('   Type:', error.constructor?.name || 'Unknown');
    console.error('   Message:', error.message || 'N/A');
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    console.error('');
    console.error('💡 Vérifications à faire:');
    console.error('   1. L\'Edge Function est-elle déployée ?');
    console.error('   2. Êtes-vous connecté à Supabase ? (vérifiez votre configuration)');
    console.error('   3. Vérifiez les logs ci-dessus pour plus de détails');
    process.exit(1);
  }
}

// Récupérer l'email depuis les arguments de la ligne de commande
const email = process.argv[2];

if (!email) {
  console.error('❌ Erreur: Veuillez fournir une adresse email');
  console.error('');
  console.error('Usage:');
  console.error('  npx tsx scripts/test-email-standalone.ts votre-email@example.com');
  console.error('');
  console.error('Ou avec les variables d\'environnement:');
  console.error('  EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... npx tsx scripts/test-email-standalone.ts votre-email@example.com');
  process.exit(1);
}

// Valider le format de l'email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Erreur: Format d\'email invalide');
  console.error(`   Email fourni: ${email}`);
  process.exit(1);
}

// Exécuter le test
testEmail(email)
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

