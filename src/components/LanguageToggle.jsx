import { useLanguage } from "../context/languageContext";

export default function LanguageToggle({ compact = false, onChange }) {
  const { language, setLanguage, t } = useLanguage();
  const nextLanguage = language === "en" ? "es" : "en";
  const change = () => {
    setLanguage(nextLanguage);
    onChange?.(nextLanguage);
  };
  return (
    <button
      type="button"
      className={`language-toggle${compact ? " compact" : ""}`}
      onClick={change}
      aria-label={nextLanguage === "es" ? t("language.switchToSpanish") : t("language.switchToEnglish")}
      title={nextLanguage === "es" ? t("language.switchToSpanish") : t("language.switchToEnglish")}
    >
      <span className={language === "en" ? "active" : ""}>EN</span>
      <i>/</i>
      <span className={language === "es" ? "active" : ""}>ES</span>
    </button>
  );
}
