/**
 * Cookie Consent Utility Functions
 * 
 * Provides helper functions to check user cookie consent preferences
 * throughout the application.
 */

const STORAGE_KEY = "cookie-consent-preferences";

export type ConsentPreferences = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

/**
 * Get stored cookie consent preferences
 */
export function getConsentPreferences(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    return parsed.preferences;
  } catch {
    return null;
  }
}

/**
 * Check if user has given consent for a specific cookie category
 */
export function hasConsent(category: keyof ConsentPreferences): boolean {
  const preferences = getConsentPreferences();
  if (!preferences) return false; // No consent given yet
  
  return preferences[category] === true;
}

/**
 * Check if user has made a consent choice
 */
export function hasConsentChoice(): boolean {
  return getConsentPreferences() !== null;
}

/**
 * Initialize Google Analytics with consent mode
 * Call this in your _app.tsx or layout.tsx
 */
export function initGoogleAnalyticsConsent() {
  if (typeof window === "undefined") return;
  
  // Set default consent to 'denied' as recommended by Google
  if ((window as any).gtag) {
    (window as any).gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      wait_for_update: 500,
    });
  }
  
  // Update consent based on stored preferences
  const preferences = getConsentPreferences();
  if (preferences) {
    if ((window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: preferences.analytics ? "granted" : "denied",
        ad_storage: preferences.marketing ? "granted" : "denied",
      });
    }
  }
}
