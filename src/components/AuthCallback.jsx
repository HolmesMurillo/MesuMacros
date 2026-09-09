import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/languageContext";
import LanguageToggle from "./LanguageToggle";
import "./AuthScreen.css";

export default function AuthCallback() {
  const auth = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function confirm() {
      if (started.current) return;
      started.current = true;
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const callbackError =
        params.get("error_description") || hash.get("error_description");
      if (callbackError) {
        setError(
          t("callback.invalid"),
        );
        setStatus("error");
        return;
      }
      try {
        let result = { error: null };
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const type = params.get("type");
        if (code) result = await auth.exchangeCode(code);
        else if (tokenHash && type)
          result = await auth.verifyOtp(tokenHash, type);
        else if (!auth.session) result = await auth.refreshSession();
        if (result.error) throw result.error;
        if (cancelled) return;
        setStatus("success");
        window.setTimeout(() => {
          if (!cancelled) window.location.replace("/inicio");
        }, 1500);
      } catch (callbackFailure) {
        if (import.meta.env.DEV) console.error(callbackFailure);
        if (!cancelled) {
          setError(
            t("callback.confirmFailed"),
          );
          setStatus("error");
        }
      }
    }
    confirm();
    return () => {
      cancelled = true;
    };
  }, [auth, t]);

  return (
    <main className="auth-shell">
      <LanguageToggle compact />
      <section className="auth-card callback-card" role="status">
        <div className="mail-icon" aria-hidden="true">
          @
        </div>
        {status === "loading" && (
          <>
            <span className="eyebrow">{t("auth.checkEmail")}</span>
            <h1>{t("callback.loading")}</h1>
          </>
        )}
        {status === "success" && (
          <>
            <span className="eyebrow">{t("callback.ready")}</span>
            <h1>{t("callback.confirmed")}</h1>
            <p className="muted">{t("callback.redirecting")}</p>
          </>
        )}
        {status === "error" && (
          <>
            <span className="eyebrow">{t("callback.failed")}</span>
            <h1>{t("callback.invalidTitle")}</h1>
            <p className="form-error">{error}</p>
            <a className="primary-button callback-link" href="/login">
              {t("auth.backToLogin")}
            </a>
          </>
        )}
      </section>
    </main>
  );
}
