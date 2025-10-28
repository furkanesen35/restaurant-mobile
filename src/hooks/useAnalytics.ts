import { useCookieConsent } from "../contexts/CookieConsentContext";

/**
 * Hook to check if analytics tracking is allowed based on cookie consent.
 * Use this before sending any analytics events.
 * 
 * @example
 * const { canTrack } = useAnalytics();
 * if (canTrack) {
 *   // Send analytics event
 * }
 */
export const useAnalytics = () => {
  const { hasConsent } = useCookieConsent();

  return {
    canTrack: hasConsent("analytics"),
    canUseMarketing: hasConsent("marketing"),
    canSavePreferences: hasConsent("preferences"),
  };
};
