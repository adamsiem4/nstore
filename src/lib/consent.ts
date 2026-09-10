// ponytail: consent is one localStorage key plus a window event — no CMP, no
// context provider, no per-category matrix. Only analytics is non-essential.
export const CONSENT_KEY = "cookie-consent";
export const CONSENT_EVENT = "cookie-consent";

export type Consent = "granted" | "denied";

/** Stored choice, or null when the visitor has not answered the banner yet. */
export function getConsent(): Consent | null {
  const stored = globalThis.localStorage?.getItem(CONSENT_KEY);
  return stored === "granted" || stored === "denied" ? stored : null;
}

/** Persist a choice (null clears it) and tell every listener in this tab. */
export function setConsent(consent: Consent | null) {
  if (consent) localStorage.setItem(CONSENT_KEY, consent);
  else localStorage.removeItem(CONSENT_KEY);

  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
}

/** `useSyncExternalStore` subscriber — consent only changes within this tab. */
export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_EVENT, onChange);
}
