// Utility to map app names to their icon paths

// Define app icon mappings
export const APP_ICONS: Record<string, string> = {
  centrepoint: '/img/centrepoint.png',
  homecentre: '/img/homecentre.png',
  max: '/img/max.png',
  homebox: '/img/homebox.png',
  mothercare: '/img/mothercare.png',
  babyshop: '/img/babyshop.png',
  splash: '/img/splash.png',
};

// Default icon for apps without a custom icon
export const DEFAULT_APP_ICON = '/img/default-app.png';

/**
 * Extract brand name from app name
 * Handles formats like "BL_Babyshop_Android", "RN_Homecentre_iOS", etc.
 * @param appName - The full app name
 * @returns The extracted brand name in lowercase
 */
export function extractBrandName(appName: string): string {
  const normalizedName = appName.toLowerCase().trim();
  
  // First, check if the app name directly matches a brand
  if (normalizedName in APP_ICONS) {
    return normalizedName;
  }
  
  // Try to extract brand from patterns like "BL_Babyshop_Android" or "RN_Homecentre_iOS"
  // Split by underscore and check each part
  const parts = normalizedName.split('_');
  
  for (const part of parts) {
    if (part in APP_ICONS) {
      return part;
    }
  }
  
  // Check if any part contains a brand name
  for (const part of parts) {
    for (const brand of Object.keys(APP_ICONS)) {
      if (part.includes(brand)) {
        return brand;
      }
    }
  }
  
  return normalizedName;
}

/**
 * Extract platform (iOS or Android) from app name
 * @param appName - The full app name
 * @returns 'ios' | 'android' | null
 */
export function extractPlatform(appName: string): 'ios' | 'android' | null {
  const normalizedName = appName.toLowerCase();
  
  if (normalizedName.includes('ios') || normalizedName.includes('_ios')) {
    return 'ios';
  }
  
  if (normalizedName.includes('android') || normalizedName.includes('_android')) {
    return 'android';
  }
  
  return null;
}

/**
 * Get the icon path for a given app name
 * @param appName - The name of the app
 * @returns The path to the app's icon
 */
export function getAppIcon(appName: string): string {
  const brandName = extractBrandName(appName);
  return APP_ICONS[brandName] || DEFAULT_APP_ICON;
}

/**
 * Check if an app has a custom icon
 * @param appName - The name of the app
 * @returns True if the app has a custom icon
 */
export function hasCustomIcon(appName: string): boolean {
  const brandName = extractBrandName(appName);
  return brandName in APP_ICONS;
}

/**
 * Get all app names that have custom icons
 * @returns Array of app names with custom icons
 */
export function getAppsWithIcons(): string[] {
  return Object.keys(APP_ICONS);
}
