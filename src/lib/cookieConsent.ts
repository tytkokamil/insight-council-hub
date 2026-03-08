/**
 * DSGVO-compliant cookie consent management.
 * Controls Plausible Analytics loading based on user consent.
 */

const CONSENT_KEY = "decivio_cookie_consent";

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
};

export function getConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

export function setConsent(consent: Partial<CookieConsent>): CookieConsent {
  const merged: CookieConsent = {
    ...DEFAULT_CONSENT,
    ...consent,
    necessary: true, // always true
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(merged));
  applyConsent(merged);
  return merged;
}

export function acceptAll(): CookieConsent {
  return setConsent({ analytics: true, marketing: true });
}

export function acceptEssentialOnly(): CookieConsent {
  return setConsent({ analytics: false, marketing: false });
}

export function hasConsented(): boolean {
  return getConsent() !== null;
}

export function isAnalyticsAllowed(): boolean {
  return getConsent()?.analytics === true;
}

// ── Plausible dynamic loading ──

let plausibleLoaded = false;

function loadPlausible() {
  if (plausibleLoaded || typeof document === "undefined") return;
  const script = document.createElement("script");
  script.defer = true;
  script.dataset.domain = "decivio.com";
  script.src = "https://plausible.io/js/script.tagged-events.js";
  document.head.appendChild(script);
  plausibleLoaded = true;
}

function unloadPlausible() {
  if (typeof window !== "undefined") {
    delete window.plausible;
  }
  // Remove script tag if present
  const scripts = document.querySelectorAll('script[src*="plausible.io"]');
  scripts.forEach((s) => s.remove());
  plausibleLoaded = false;
}

export function applyConsent(consent: CookieConsent) {
  if (consent.analytics) {
    loadPlausible();
  } else {
    unloadPlausible();
  }
}

/** Call on app init to apply stored consent */
export function initConsent() {
  const consent = getConsent();
  if (consent) {
    applyConsent(consent);
  }
  // If no consent yet, don't load anything (default = no tracking)
}
