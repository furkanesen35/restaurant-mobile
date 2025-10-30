import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  return {
    t,
    currentLanguage: i18n.language,
    changeLanguage: (language: string) => i18n.changeLanguage(language),
  };
};
