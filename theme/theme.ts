/**
 * Design System - Thème Premium White-First
 * 
 * Palette de base (UNIQUEMENT pour accents/détails) :
 * - #000022 (bleu nuit profond)
 * - #002B39 (bleu-vert pétrole)
 * - #040F16 (noir bleuté / charbon)
 * 
 * Design moderne, épuré, premium "white-first" :
 * - Fonds majoritairement blancs/transparents
 * - Surfaces très claires (blanc cassé / gris très clair)
 * - Couleurs de marque réservées aux accents (CTA, liens, icônes, focus, indicateurs)
 * - Beaucoup d'air (spacing), lignes fines, ombres très subtiles
 */

// ============================================
// PALETTE DE COULEURS
// ============================================

/**
 * Génère des nuances d'une couleur (tints/shades)
 */
const generateColorScale = (base: string, name: string) => {
  // Conversion hex vers RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Conversion RGB vers hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  };

  const rgb = hexToRgb(base);
  if (!rgb) return {};

  const scale: Record<string, string> = {};

  // Génération des tints (plus clairs)
  const tints = [50, 100, 200, 300, 400, 500];
  tints.forEach((level, index) => {
    const factor = (index + 1) * 0.15;
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));
    scale[level] = rgbToHex(r, g, b);
  });

  // Base (500)
  scale[500] = base;

  // Génération des shades (plus foncés)
  const shades = [600, 700, 800, 900];
  shades.forEach((level, index) => {
    const factor = (index + 1) * 0.2;
    const r = Math.max(0, Math.round(rgb.r * (1 - factor)));
    const g = Math.max(0, Math.round(rgb.g * (1 - factor)));
    const b = Math.max(0, Math.round(rgb.b * (1 - factor)));
    scale[level] = rgbToHex(r, g, b);
  });

  return scale;
};

// Couleurs de base
const midnightBlue = '#000022';
const petrolBlue = '#002B39';
const charcoalBlue = '#040F16';

// Échelles de couleurs
const midnightBlueScale = generateColorScale(midnightBlue, 'midnightBlue');
const petrolBlueScale = generateColorScale(petrolBlue, 'petrolBlue');
const charcoalBlueScale = generateColorScale(charcoalBlue, 'charcoalBlue');

// Couleurs neutres pour texte
const offWhite = '#F5F5F7'; // Blanc cassé
const blueGray = '#6B7A8A'; // Gris bleuté

// Palette complète
export const colorPalette = {
  // Couleurs primaires
  midnightBlue: {
    ...midnightBlueScale,
    500: midnightBlue,
  },
  petrolBlue: {
    ...petrolBlueScale,
    500: petrolBlue,
  },
  charcoalBlue: {
    ...charcoalBlueScale,
    500: charcoalBlue,
  },

  // Neutres
  offWhite,
  blueGray,

  // Couleurs sémantiques
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
};

// ============================================
// RÔLES DE COULEURS (WHITE-FIRST MODE - DÉFAUT)
// ============================================

export const lightColors = {
  // Backgrounds - BLANCS/TRÈS CLAIRS
  background: '#FFFFFF', // Blanc pur
  surface: '#FAFAFA', // Blanc cassé très léger
  elevated: '#FFFFFF', // Blanc pur pour surfaces élevées
  overlay: 'rgba(255, 255, 255, 0.9)',

  // Primary & Secondary - Couleurs de marque EXACTES de la charte
  primary: petrolBlue, // #002B39 (couleur de marque exacte)
  primaryLight: colorPalette.petrolBlue[400], // Nuance plus claire pour hover
  primaryDark: colorPalette.petrolBlue[600], // Nuance plus foncée pour pressed
  secondary: midnightBlue, // #000022 (couleur de marque exacte)
  secondaryLight: colorPalette.midnightBlue[400],
  secondaryDark: colorPalette.midnightBlue[600],

  // Accent (pour CTA, toggles, liens, focus) - Utilise #002B39 directement
  accent: petrolBlue, // #002B39 (couleur de marque exacte pour CTA)
  accentLight: colorPalette.petrolBlue[400],
  accentDark: colorPalette.petrolBlue[600],

  // Text - NOIR DOUX / TRÈS SOMBRE sur fond blanc
  text: colorPalette.charcoalBlue[500], // #040F16 (noir doux)
  textMuted: '#6B7280', // Gris moyen pour texte secondaire
  textSecondary: '#9CA3AF', // Gris clair pour texte tertiaire

  // Borders & Dividers - GRIS TRÈS CLAIR
  border: '#E5E7EB', // Gris très clair (ligne fine)
  divider: '#F3F4F6', // Encore plus clair pour séparateurs
  borderLight: '#F9FAFB', // Presque invisible

  // Sémantiques
  success: colorPalette.success[600],
  successLight: colorPalette.success[500],
  successDark: colorPalette.success[700],
  warning: colorPalette.warning[600],
  warningLight: colorPalette.warning[500],
  warningDark: colorPalette.warning[700],
  error: colorPalette.error[600],
  errorLight: colorPalette.error[500],
  errorDark: colorPalette.error[700],

  // États
  pressed: 'rgba(0, 43, 57, 0.08)', // Très subtil pour feedback tactile
  disabled: '#F3F4F6', // Gris très clair
  disabledText: '#9CA3AF', // Gris moyen
};

// ============================================
// DARK MODE (optionnel, pour compatibilité)
// ============================================

export const darkColors = {
  // Backgrounds
  background: colorPalette.charcoalBlue[500], // #040F16
  surface: colorPalette.charcoalBlue[600], // Nuance plus claire de charcoalBlue
  elevated: colorPalette.charcoalBlue[700], // Légèrement plus clair
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Primary & Secondary - Couleurs de marque EXACTES
  primary: petrolBlue, // #002B39
  primaryLight: colorPalette.petrolBlue[400],
  primaryDark: colorPalette.petrolBlue[600],
  secondary: colorPalette.charcoalBlue[500], // #040F16 au lieu de #000022
  secondaryLight: colorPalette.charcoalBlue[400],
  secondaryDark: colorPalette.charcoalBlue[700],

  // Accent (pour CTA, toggles, liens) - Utilise #002B39 directement
  accent: petrolBlue, // #002B39 (couleur de marque exacte)
  accentLight: colorPalette.petrolBlue[400],
  accentDark: colorPalette.petrolBlue[600],

  // Text
  text: colorPalette.offWhite, // #F5F5F7
  textMuted: colorPalette.blueGray, // #6B7A8A
  textSecondary: colorPalette.charcoalBlue[300], // Nuance de charcoalBlue

  // Borders & Dividers
  border: colorPalette.petrolBlue[700], // Très subtil
  divider: colorPalette.charcoalBlue[700], // Nuance de charcoalBlue
  borderLight: colorPalette.petrolBlue[600],

  // Sémantiques
  success: colorPalette.success[500],
  successLight: colorPalette.success[400],
  successDark: colorPalette.success[600],
  warning: colorPalette.warning[500],
  warningLight: colorPalette.warning[400],
  warningDark: colorPalette.warning[600],
  error: colorPalette.error[500],
  errorLight: colorPalette.error[400],
  errorDark: colorPalette.error[600],

  // États
  pressed: 'rgba(0, 168, 181, 0.1)',
  disabled: colorPalette.charcoalBlue[800], // Nuance de charcoalBlue
  disabledText: colorPalette.blueGray,
};

// ============================================
// TRUE BLACK MODE (OLED - optionnel)
// ============================================

export const trueBlackColors = {
  ...darkColors,
  background: '#000000',
  surface: '#000000',
  elevated: colorPalette.charcoalBlue[500],
};

// ============================================
// TYPOGRAPHIE
// ============================================

export const typography = {
  // Échelle de tailles
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Poids de police
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (ratio 1.5 pour lisibilité optimale)
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 30,
    '2xl': 36,
    '3xl': 45,
    '4xl': 54,
    '5xl': 72,
  },

  // Letter spacing (très subtil pour look premium)
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// ============================================
// SPACING SCALE
// ============================================

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

// ============================================
// SHADOWS (très subtiles pour white-first)
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, // Très subtil
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Subtile
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, // Légèrement plus visible
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, // Pour élévation importante
    shadowRadius: 16,
    elevation: 4,
  },
};

// ============================================
// TOKENS DE COMPOSANTS
// ============================================

export const componentTokens = {
  // Boutons
  button: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    paddingHorizontal: {
      sm: spacing[3],
      md: spacing[4],
      lg: spacing[6],
    },
    borderRadius: radius.md,
    minWidth: 120,
  },

  // Inputs
  input: {
    height: {
      sm: 40,
      md: 48,
      lg: 56,
    },
    paddingHorizontal: spacing[4],
    borderRadius: radius.base,
    borderWidth: 1,
  },

  // Cards
  card: {
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
  },

  // Icônes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
  },

  // Headers
  header: {
    height: 56,
    paddingHorizontal: spacing[4],
  },
};

// ============================================
// TYPES
// ============================================

export type ThemeMode = 'dark' | 'light' | 'trueBlack';

export type Theme = {
  mode: ThemeMode;
  colors: typeof darkColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  componentTokens: typeof componentTokens;
};

// ============================================
// THÈME PAR DÉFAUT (WHITE-FIRST)
// ============================================

export const defaultTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  radius,
  shadows,
  componentTokens,
};

export const trueBlackTheme: Theme = {
  ...defaultTheme,
  mode: 'trueBlack',
  colors: trueBlackColors,
};

export const lightTheme: Theme = {
  ...defaultTheme,
  mode: 'light',
  colors: lightColors,
};

export const darkTheme: Theme = {
  ...defaultTheme,
  mode: 'dark',
  colors: darkColors,
};

