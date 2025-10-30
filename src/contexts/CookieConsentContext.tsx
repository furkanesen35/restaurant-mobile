import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "../utils/logger";

export type CookieConsent = {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

interface CookieConsentContextType {
  consent: CookieConsent | null;
  showBanner: boolean;
  acceptAll: () => Promise<void>;
  rejectAll: () => Promise<void>;
  savePreferences: (preferences: CookieConsent) => Promise<void>;
  resetConsent: () => Promise<void>;
  hasConsent: (type: keyof CookieConsent) => boolean;
}

const CookieConsentContext = createContext<
  CookieConsentContextType | undefined
>(undefined);

const CONSENT_STORAGE_KEY = "cookie_consent";

const defaultConsent: CookieConsent = {
  necessary: true, // Always enabled
  analytics: false,
  marketing: false,
  preferences: false,
};

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    loadConsent();
  }, []);

  const loadConsent = async () => {
    try {
      const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConsent(parsed);
        setShowBanner(false);
      } else {
        // No consent stored, show banner
        setShowBanner(true);
      }
    } catch (error) {
      logger.error("Failed to load cookie consent:", error);
      setShowBanner(true);
    }
  };

  const saveConsent = async (newConsent: CookieConsent) => {
    try {
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newConsent));
      setConsent(newConsent);
      setShowBanner(false);
    } catch (error) {
      logger.error("Failed to save cookie consent:", error);
    }
  };

  const acceptAll = useCallback(async () => {
    const allAccepted: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    await saveConsent(allAccepted);
  }, []);

  const rejectAll = useCallback(async () => {
    // Only necessary cookies (which are always on)
    await saveConsent(defaultConsent);
  }, []);

  const savePreferences = useCallback(async (preferences: CookieConsent) => {
    // Ensure necessary is always true
    const safePreferences = { ...preferences, necessary: true };
    await saveConsent(safePreferences);
  }, []);

  const resetConsent = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CONSENT_STORAGE_KEY);
      setConsent(null);
      setShowBanner(true);
    } catch (error) {
      logger.error("Failed to reset consent:", error);
    }
  }, []);

  const hasConsent = useCallback(
    (type: keyof CookieConsent): boolean => {
      if (!consent) return type === "necessary"; // Only necessary cookies before consent
      return consent[type] === true;
    },
    [consent]
  );

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        showBanner,
        acceptAll,
        rejectAll,
        savePreferences,
        resetConsent,
        hasConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error(
      "useCookieConsent must be used within CookieConsentProvider"
    );
  }
  return context;
};
