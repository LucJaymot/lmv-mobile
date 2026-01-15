/**
 * Script de test pour l'envoi d'email via l'Edge Function Supabase
 * 
 * Usage:
 *   npx tsx scripts/test-email.ts votre-email@example.com
 * 
 * Ou depuis Node.js:
 *   node -r ts-node/register scripts/test-email.ts votre-email@example.com
 */

import { supabase } from '../lib/supabase';

async function testEmail(to: string) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TEST D\'ENVOI D\'EMAIL VIA EDGE FUNCTION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📧 Email destinataire: ${to}`);
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
      process.exit(1);
    }

    if (data) {
      console.log('✅ Réponse de l\'Edge Function:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      console.log('✅ Email envoyé avec succès !');
      console.log(`📧 Vérifiez votre boîte email: ${to}`);
      console.log('   (Vérifiez aussi le dossier spam si nécessaire)');
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
    console.error('   Stack:', error.stack || 'N/A');
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
  console.error('  npx tsx scripts/test-email.ts votre-email@example.com');
  console.error('');
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

