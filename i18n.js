import "intl-pluralrules";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import es from "./locales/es.json";
import tr from "./locales/tr.json";

/**
 * i18n setup.
 *
 * Initialised synchronously so that the very first render already has
 * translations. The previous version ran init() inside a promise callback, so
 * any component rendering before AsyncStorage resolved got raw keys back and
 * then flickered to real text.
 *
 * keySeparator and nsSeparator are disabled because the keys in this project
 * are whole English sentences. With the defaults, "This cannot be undone."
 * would be parsed as a path into a nested object and resolve to nothing, and
 * anything containing a colon would be read as a namespace reference.
 */
i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    tr: { translation: tr },
  },
  lng: "en",
  fallbackLng: "en",
  keySeparator: false,
  nsSeparator: false,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Apply the stored preference once it is available.
AsyncStorage.getItem("selectedLanguage")
  .then((saved) => {
    if (saved && saved !== i18next.language) {
      return i18next.changeLanguage(saved);
    }
    return undefined;
  })
  .catch(() => {
    // Falls back to English, which is already active.
  });

export default i18next;
