import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import th from './locales/th.json';
import ko from './locales/ko.json';

export type LanguageCode = 'EN' | 'TH' | 'KO' | 'DUAL';

const initialLang = (localStorage.getItem('app_language') || 'TH').toUpperCase();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      th: { translation: th },
      ko: { translation: ko },
      EN: { translation: en },
      TH: { translation: th },
      KO: { translation: ko }
    },
    lng: initialLang.toLowerCase(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
