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
  const operation = useRef(null);
  const initial = useRef({ auth, t });

  useEffect(() => {
    let cancelled = false;
    async function confirm() {
      const { auth, t } = initial.current;
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const callbackError =
        params.get("error_description") || hash.get("error_description");
      if (callbackError) {
        throw new Error(t("callback.invalid"));
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
        const session = result.data?.session || auth.session || (await auth.refreshSession()).data?.session;
        if (!session) throw new Error(t("callback.confirmFailed"));
      } catch (callbackFailure) {
        if (import.meta.env.DEV) console.error(callbackFailure);
        throw callbackFailure;
      }
    }
    if (!operation.current) operation.current = confirm();
    operation.current.then(() => {
      if (!cancelled) {
        window.history.replaceState({}, "", window.location.pathname);
        setStatus("success");
      }
    }).catch(() => {
      if (!cancelled) {
        setError(initial.current.t("callback.confirmFailed"));
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "success") return undefined;
    const redirectTimer = window.setTimeout(() => {
      window.location.replace("/");
    }, 1500);
    return () => window.clearTimeout(redirectTimer);
  }, [status]);

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
            <a className="primary-button callback-link" href="/">
              {t("callback.continue")}
            </a>
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
