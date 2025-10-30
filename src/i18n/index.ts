import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import de from './translations/de.json';
import en from './translations/en.json';
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from './languages';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Get device language
const getDeviceLanguage = (): string => {
  const locale = Localization.getLocales()[0];
  const languageCode = locale?.languageCode || DEFAULT_LANGUAGE;
  
  // Check if the device language is supported
  if (languageCode === 'de' || languageCode === 'en') {
    return languageCode;
  }
  
  return DEFAULT_LANGUAGE;
};

// Get stored language or device language
export const getInitialLanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage) {
      return storedLanguage;
    }
    return getDeviceLanguage();
  } catch (error) {
    console.error('Error getting initial language:', error);
    return getDeviceLanguage();
  }
};

// Save language preference
export const saveLanguagePreference = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
