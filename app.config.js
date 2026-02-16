const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    console.log('📄 Fichier .env trouvé:', envPath);
    const envFile = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Contenu du .env:', envFile);
    
    envFile.split('\n').forEach((line, index) => {
      // Ignorer les lignes vides et les commentaires
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }
      
      // Parser KEY=VALUE (avec ou sans guillemets, avec ou sans espaces)
      const match = trimmedLine.match(/^([^=:#]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Retirer les guillemets simples ou doubles
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        env[key] = value;
        console.log(`✅ Variable chargée: ${key} = ${value.substring(0, 10)}...`);
      } else {
        console.log(`⚠️ Ligne ${index + 1} ignorée (format invalide): ${trimmedLine}`);
      }
    });
  } else {
    console.error('❌ Fichier .env non trouvé à:', envPath);
  }
  
  console.log('📦 Variables chargées:', Object.keys(env));
  return env;
}

const env = loadEnv();

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 CONFIGURATION EXPO - Variables d\'environnement');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('EXPO_PUBLIC_CARSXE_API_KEY depuis .env:', env.EXPO_PUBLIC_CARSXE_API_KEY ? 
  `✅ ${env.EXPO_PUBLIC_CARSXE_API_KEY.substring(0, 15)}...` : '❌ NON TROUVÉE');
console.log('EXPO_PUBLIC_CARSXE_API_KEY depuis process.env:', process.env.EXPO_PUBLIC_CARSXE_API_KEY ? 
  `✅ ${process.env.EXPO_PUBLIC_CARSXE_API_KEY.substring(0, 15)}...` : '❌ NON TROUVÉE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

module.exports = {
  expo: {
    name: "Lavemavoiture",
    slug: "Lavemavoiture",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo_LMV.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/logo_LMV.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.Natively",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo_LMV.png",
        backgroundColor: "#000000"
      },
      edgeToEdgeEnabled: true,
      package: "com.anonymous.Natively"
    },
    web: {
      favicon: "./assets/images/final_quest_240x240.png",
      bundler: "metro"
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/logo_LMV.png",
          "color": "#000000",
          "sounds": []
        }
      ]
    ],
    scheme: "natively",
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      // Exposer les variables d'environnement depuis .env
      supabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      carsxeApiKey: env.EXPO_PUBLIC_CARSXE_API_KEY || process.env.EXPO_PUBLIC_CARSXE_API_KEY,
      brandfetchClientId: env.EXPO_PUBLIC_BRANDFETCH_CLIENT_ID || process.env.EXPO_PUBLIC_BRANDFETCH_CLIENT_ID,
    }
  },
  scheme: "WashFleet"
};

