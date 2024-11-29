import "intl-pluralrules";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./locales/en.json";
import es from "./locales/es.json";
import tr from "./locales/tr.json";

const getSavedLanguage = async () => {
  const lng = await AsyncStorage.getItem("selectedLanguage");
  return lng || "en"; // Default to English
  // return 'tr'
};

getSavedLanguage().then((lng) => {
  i18next
    .use(initReactI18next) // Pass i18next instance to react-i18next
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
        tr: { translation: tr },
      },
      lng: lng,
      fallbackLng: "en",
      interpolation: {
        escapeValue: false, // React already escapes values
      },
    });
});

export default i18next;
