import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '../i18n';
import { getInitialLanguage, saveLanguagePreference } from '../i18n';
import { LanguageCode } from '../i18n/languages';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  changeLanguage: (language: LanguageCode) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('de');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved language preference or use device language
    const loadLanguage = async () => {
      try {
        const savedLanguage = await getInitialLanguage();
        await i18n.changeLanguage(savedLanguage);
        setCurrentLanguage(savedLanguage as LanguageCode);
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = async (language: LanguageCode) => {
    try {
      await i18n.changeLanguage(language);
      await saveLanguagePreference(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
