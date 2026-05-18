// ─── CodePush App Configuration ───────────────────────────────────────────────
// Two territories: BLC (prefix BL_) and Hybris (prefix RN_)
// Each has different concepts and per-platform environment availability.

export type Territory = 'BLC' | 'Hybris';
export type CodePushPlatform = 'iOS' | 'Android';
export type CodePushEnvironment = 'Production' | 'ProductionStaging' | 'Staging';

export interface ConceptConfig {
  name: string;           // Display name
  appNameKey: string;     // Default key used in the CodePush app name (e.g., "Babyshop", "MaxAE")
  /** Per-platform overrides when the CodePush server uses a different name per platform */
  appNameKeyByPlatform?: Partial<Record<CodePushPlatform, string>>;
}

export interface TerritoryConfig {
  id: Territory;
  label: string;
  prefix: string;         // "BL" or "RN"
  concepts: ConceptConfig[];
  /**
   * Environments available per platform.
   * Hybris iOS only has Production + Staging (no ProductionStaging),
   * while Android and all BLC apps have all 3.
   */
  environments: Record<CodePushPlatform, CodePushEnvironment[]>;
}

// ─── BLC Territory ────────────────────────────────────────────────────────────
const BLC_CONCEPTS: ConceptConfig[] = [
  { name: 'Babyshop',     appNameKey: 'Babyshop' },
  { name: 'Centrepoint',  appNameKey: 'Centrepoint' },
  { name: 'Emax',         appNameKey: 'Emax' },
  { name: 'Homebox',      appNameKey: 'Homebox' },
  { name: 'Homecentre',   appNameKey: 'Homecentre' },
  { name: 'Max',          appNameKey: 'Max' },
  { name: 'Mothercare',   appNameKey: 'Mothercare' },
  { name: 'Splash',       appNameKey: 'Splash' },
];

// ─── Hybris Territory ─────────────────────────────────────────────────────────
// Note: Some names differ from BLC (e.g., "MaxAE", "HomecentreAE")
// Centrepoint has a typo on the server: iOS = "Centrepoint", Android = "Centrpoint"
const HYBRIS_CONCEPTS: ConceptConfig[] = [
  { name: 'Babyshop',     appNameKey: 'Babyshop' },
  { name: 'Centrepoint',  appNameKey: 'Centrepoint', appNameKeyByPlatform: { Android: 'Centrpoint' } },
  { name: 'Homebox',      appNameKey: 'Homebox' },
  { name: 'Homecentre',   appNameKey: 'HomecentreAE' },
  { name: 'Max',          appNameKey: 'MaxAE' },
  { name: 'Mothercare',   appNameKey: 'Mothercare' },
  { name: 'Splash',       appNameKey: 'Splash' },
];

// ─── Territory Configs ────────────────────────────────────────────────────────

export const TERRITORIES: TerritoryConfig[] = [
  {
    id: 'BLC',
    label: 'BLC',
    prefix: 'BL',
    concepts: BLC_CONCEPTS,
    environments: {
      iOS:     ['Production', 'ProductionStaging', 'Staging'],
      Android: ['Production', 'ProductionStaging', 'Staging'],
    },
  },
  {
    id: 'Hybris',
    label: 'Hybris',
    prefix: 'RN',
    concepts: HYBRIS_CONCEPTS,
    environments: {
      iOS:     ['Production', 'Staging'],                          // No ProductionStaging
      Android: ['Production', 'ProductionStaging', 'Staging'],
    },
  },
];

export const PLATFORMS: CodePushPlatform[] = ['iOS', 'Android'];

/**
 * Build the CodePush app name.
 * Uses per-platform override if available, otherwise falls back to default key.
 * e.g., getAppName('BL', 'Babyshop', 'iOS') → "BL_Babyshop_iOS"
 *        getAppName('RN', 'Centrepoint', 'Android', { Android: 'Centrpoint' }) → "RN_Centrpoint_Android"
 */
export function getAppName(
  prefix: string,
  conceptKey: string,
  platform: CodePushPlatform,
  keyOverrides?: Partial<Record<CodePushPlatform, string>>,
): string {
  const key = keyOverrides?.[platform] || conceptKey;
  return `${prefix}_${key}_${platform}`;
}

/**
 * Get a territory config by ID.
 */
export function getTerritoryConfig(territory: Territory): TerritoryConfig {
  return TERRITORIES.find((t) => t.id === territory)!;
}

/**
 * Concept display colors for pills / badges.
 */
export const CONCEPT_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Babyshop:     { bg: 'bg-pink-100',    text: 'text-pink-700',    darkBg: 'bg-pink-900/30',    darkText: 'text-pink-300' },
  Centrepoint:  { bg: 'bg-purple-100',  text: 'text-purple-700',  darkBg: 'bg-purple-900/30',  darkText: 'text-purple-300' },
  Emax:         { bg: 'bg-orange-100',  text: 'text-orange-700',  darkBg: 'bg-orange-900/30',  darkText: 'text-orange-300' },
  Homebox:      { bg: 'bg-teal-100',    text: 'text-teal-700',    darkBg: 'bg-teal-900/30',    darkText: 'text-teal-300' },
  Homecentre:   { bg: 'bg-cyan-100',    text: 'text-cyan-700',    darkBg: 'bg-cyan-900/30',    darkText: 'text-cyan-300' },
  Max:          { bg: 'bg-red-100',     text: 'text-red-700',     darkBg: 'bg-red-900/30',     darkText: 'text-red-300' },
  Mothercare:   { bg: 'bg-blue-100',    text: 'text-blue-700',    darkBg: 'bg-blue-900/30',    darkText: 'text-blue-300' },
  Splash:       { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'bg-emerald-900/30', darkText: 'text-emerald-300' },
};
