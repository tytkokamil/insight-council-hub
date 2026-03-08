/**
 * Plausible Analytics — DSGVO-konform, consent-basiert.
 * Plausible wird nur geladen wenn der Nutzer Analytics-Cookies akzeptiert hat.
 */

import { isAnalyticsAllowed } from "@/lib/cookieConsent";

type PlausibleEventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: PlausibleEventProps }) => void;
  }
}

export function track(event: string, props?: PlausibleEventProps): void {
  if (typeof window !== "undefined" && window.plausible && isAnalyticsAllowed()) {
    window.plausible(event, props ? { props } : undefined);
  }
}

// ─── Predefined events ─────────────────────────────────────────────

export const analytics = {
  signup: () => track("Signup"),

  decisionCreated: (template?: string) =>
    track("Decision Created", template ? { template } : undefined),

  upgradeClick: (plan: string, source: "banner" | "modal" | "billing" | "pricing") =>
    track("Upgrade Click", { plan, source }),

  checkoutStarted: (plan: string) =>
    track("Checkout Started", { plan }),

  oneClickApproval: (action: "approved" | "rejected") =>
    track("One Click Approval", { action }),

  aiFeatureUsed: (feature: "copilot" | "daily_brief" | "analysis") =>
    track("AI Feature Used", { feature }),

  trialExpired: () => track("Trial Expired"),

  demoStarted: () => track("Demo Started"),

  foundingCtaClick: () => track("Founding CTA Click"),
};
