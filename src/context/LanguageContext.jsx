import { useCallback, useEffect, useMemo, useState } from "react";
import { localeFor, translate } from "../i18n/translations";
import { LanguageContext } from "./languageContext";

const LANGUAGE_KEY = "mesumacros:language";
function initialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved === "es" || saved === "en" ? saved : "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(initialLanguage);
  const setLanguage = useCallback((nextLanguage) => {
    const next = nextLanguage === "es" ? "es" : "en";
    setLanguageState(next);
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* storage may be unavailable */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, "app.documentTitle");
  }, [language]);

  const value = useMemo(() => ({
    language,
    locale: localeFor(language),
    setLanguage,
    t: (key, variables) => translate(language, key, variables),
  }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
