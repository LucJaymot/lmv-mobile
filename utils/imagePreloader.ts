import { Image, Platform } from 'react-native';

/**
 * Service pour précharger les images au démarrage de l'application
 * Cela améliore les performances en évitant les délais de chargement
 */

// Logos LMV
const lmvLogos = {
  light: require('@/assets/images/logo_LMV.png'),
  dark: require('@/assets/images/logo_LMV_blanc.png'),
};

// Marques les plus courantes (top 20)
const commonBrands = [
  'renault',
  'peugeot',
  'citroen',
  'volkswagen',
  'audi',
  'bmw',
  'mercedes-benz',
  'ford',
  'opel',
  'fiat',
  'toyota',
  'nissan',
  'honda',
  'hyundai',
  'kia',
  'mazda',
  'suzuki',
  'mitsubishi',
  'subaru',
  'volvo',
];

/**
 * Précharge les logos LMV
 */
export function preloadLMVLogos(): Promise<void> {
  return new Promise((resolve) => {
    // Sur web, les images require() sont déjà chargées, pas besoin de prefetch
    if (Platform.OS === 'web') {
      console.log('✅ Logos LMV (web - déjà chargés)');
      resolve();
      return;
    }
    
    const promises: Promise<any>[] = [];
    
    try {
      // Précharger les deux versions du logo LMV
      const lightSource = Image.resolveAssetSource(lmvLogos.light);
      const darkSource = Image.resolveAssetSource(lmvLogos.dark);
      
      if (lightSource?.uri) {
        promises.push(Image.prefetch(lightSource.uri).catch(() => {}));
      }
      if (darkSource?.uri) {
        promises.push(Image.prefetch(darkSource.uri).catch(() => {}));
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la résolution des logos LMV:', error);
    }
    
    if (promises.length === 0) {
      resolve();
      return;
    }
    
    Promise.all(promises).then(() => {
      console.log('✅ Logos LMV préchargés');
      resolve();
    }).catch(() => {
      console.warn('⚠️ Erreur lors du préchargement des logos LMV');
      resolve(); // Résoudre quand même pour ne pas bloquer
    });
  });
}

/**
 * Précharge les logos de marques les plus courantes
 */
export function preloadCommonBrandLogos(brandLogos: Record<string, any>): Promise<void> {
  return new Promise((resolve) => {
    // Sur web, les images require() sont déjà chargées, pas besoin de prefetch
    if (Platform.OS === 'web') {
      console.log('✅ Logos de marques (web - déjà chargés)');
      resolve();
      return;
    }
    
    const promises: Promise<any>[] = [];
    
    commonBrands.forEach((brand) => {
      const logo = brandLogos[brand];
      if (logo) {
        try {
          const assetSource = Image.resolveAssetSource(logo);
          if (assetSource?.uri) {
            promises.push(
              Image.prefetch(assetSource.uri).catch(() => {})
            );
          }
        } catch (error) {
          // Ignorer les erreurs de préchargement
        }
      }
    });
    
    if (promises.length === 0) {
      resolve();
      return;
    }
    
    Promise.all(promises).then(() => {
      console.log(`✅ ${promises.length} logos de marques préchargés`);
      resolve();
    }).catch(() => {
      console.warn('⚠️ Erreur lors du préchargement des logos de marques');
      resolve(); // Résoudre quand même pour ne pas bloquer
    });
  });
}

/**
 * Précharge toutes les images importantes au démarrage
 */
export async function preloadAllImages(brandLogos: Record<string, any>): Promise<void> {
  console.log('🔄 Début du préchargement des images...');
  const startTime = Date.now();
  
  // Précharger les logos LMV en premier (priorité)
  await preloadLMVLogos();
  
  // Précharger les logos de marques courantes en arrière-plan
  preloadCommonBrandLogos(brandLogos).catch(() => {});
  
  const duration = Date.now() - startTime;
  console.log(`✅ Préchargement des images terminé en ${duration}ms`);
}
