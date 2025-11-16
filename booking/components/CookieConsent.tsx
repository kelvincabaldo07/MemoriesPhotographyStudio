"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Cookie, Settings } from "lucide-react";

type ConsentPreferences = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "cookie-consent-preferences";
const CONSENT_VERSION = "1.0";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true, // Always required
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load stored preferences
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed.preferences);
          applyConsent(parsed.preferences);
        } else {
          // Version mismatch, show banner again
          setIsVisible(true);
        }
      } catch {
        setIsVisible(true);
      }
    }
  }, []);

  const applyConsent = (prefs: ConsentPreferences) => {
    // Apply analytics consent (Google Analytics)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: prefs.analytics ? "granted" : "denied",
        ad_storage: prefs.marketing ? "granted" : "denied",
      });
    }

    // Store in window for other scripts to check
    (window as any).__cookieConsent = prefs;
  };

  const savePreferences = (prefs: ConsentPreferences) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: CONSENT_VERSION,
        preferences: prefs,
        timestamp: new Date().toISOString(),
      })
    );
    applyConsent(prefs);
    setPreferences(prefs);
    setIsVisible(false);
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  };

  const acceptEssential = () => {
    savePreferences({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-[90]" aria-hidden="true" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          {/* Simple View */}
          {!showSettings && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1 flex items-start gap-3">
                <Cookie className="w-6 h-6 text-[#0b3d2e] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    We value your privacy
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                    By clicking "Accept All", you consent to our use of cookies. You can customize your preferences or read our{" "}
                    <a href="/privacy" className="underline hover:text-[#0b3d2e]">
                      Privacy Policy
                    </a>.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
                <Button
                  variant="outline"
                  onClick={acceptEssential}
                  className="w-full sm:w-auto"
                >
                  Essential Only
                </Button>
                <Button
                  onClick={acceptAll}
                  className="w-full sm:w-auto bg-[#0b3d2e] hover:bg-[#0b3d2e]/90 text-white"
                >
                  Accept All
                </Button>
              </div>
            </div>
          )}

          {/* Settings View */}
          {showSettings && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                {/* Essential Cookies */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Checkbox
                    checked={preferences.essential}
                    disabled
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Essential Cookies <span className="text-xs text-gray-500">(Required)</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      These cookies are necessary for the website to function and cannot be disabled. 
                      They enable core functionality like security, session management, and accessibility.
                    </p>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Checkbox
                    checked={preferences.functional}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, functional: !!checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Functional Cookies
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      These cookies enable enhanced functionality like remembering your preferences 
                      (theme, language) and providing personalized features.
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Checkbox
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, analytics: !!checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Analytics Cookies
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      These cookies help us understand how visitors interact with our website by 
                      collecting and reporting information anonymously. We use Google Analytics 
                      with a 26-month retention period.
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Checkbox
                    checked={preferences.marketing}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, marketing: !!checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Marketing Cookies
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      These cookies track your browsing habits to show you relevant advertisements 
                      and measure the effectiveness of our marketing campaigns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={acceptEssential}
                  className="w-full sm:w-auto"
                >
                  Essential Only
                </Button>
                <Button
                  onClick={saveCustom}
                  className="w-full sm:flex-1 bg-[#0b3d2e] hover:bg-[#0b3d2e]/90 text-white"
                >
                  Save Preferences
                </Button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                You can change your preferences at any time by visiting our{" "}
                <a href="/privacy" className="underline hover:text-[#0b3d2e]">
                  Privacy Policy
                </a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
