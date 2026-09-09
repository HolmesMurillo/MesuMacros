import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/languageContext";
import LanguageToggle from "./LanguageToggle";
import "./AuthScreen.css";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function clearRecoveryTokens() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export default function ResetPassword() {
  const auth = useAuth();
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }
    let mounted = true;
    const enableRecovery = (session) => {
      if (!mounted || !session) return;
      setReady(true);
      setChecking(false);
      clearRecoveryTokens();
    };
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) enableRecovery(session);
      },
    );
    supabase.auth
      .getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (!mounted) return;
        if (sessionError || !session) setChecking(false);
        else enableRecovery(session);
      })
      .catch(() => {
        if (mounted) setChecking(false);
      });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!newPassword || !confirmation)
      return setError(t("reset.completeFields"));
    if (newPassword.length < 8)
      return setError(t("auth.passwordLength"));
    if (newPassword !== confirmation)
      return setError(t("auth.passwordMismatch"));
    setBusy(true);
    try {
      const result = await auth.updatePassword(newPassword);
      if (result.error) {
        setError(result.error.message);
        setBusy(false);
        return;
      }
      setMessage(t("reset.success"));
      window.setTimeout(async () => {
        try {
          await auth.signOut();
        } finally {
          navigate("/login?password=updated");
        }
      }, 1200);
    } catch {
      setError(t("reset.failed"));
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <LanguageToggle compact />
      <section className="auth-card">
        <div className="auth-panel">
          <div className="brand auth-brand">
            <span className="brand-mark">M</span>
            <span>
              Mesu<span>Macros</span>
            </span>
          </div>
          <div className="auth-heading">
            <h1>{t("reset.title")}</h1>
            <p className="muted">{t("reset.subtitle")}</p>
          </div>
          {checking && (
            <p className="muted" role="status">
              {t("reset.processingLink")}
            </p>
          )}
          {!checking && !ready && (
            <div className="auth-form">
              <p className="form-error" role="alert">
                {t("reset.invalidLink")}
              </p>
              <button
                className="primary-button auth-submit"
                onClick={() => navigate("/forgot")}
              >
                {t("reset.requestNew")}
              </button>
            </div>
          )}
          {ready && (
            <form onSubmit={submit} className="auth-form">
              <PasswordField
                label={t("reset.newPassword")}
                value={newPassword}
                onChange={setNewPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />
              <PasswordField
                label={t("reset.confirmPassword")}
                value={confirmation}
                onChange={setConfirmation}
                visible={showConfirmation}
                onToggle={() => setShowConfirmation((value) => !value)}
              />
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="auth-message" role="status">
                  {message}
                </p>
              )}
              <button className="primary-button auth-submit" disabled={busy}>
                {busy ? t("common.processing") : t("reset.save")}
              </button>
            </form>
          )}
          <div className="auth-links">
            <button onClick={() => navigate("/login")}>
              {t("auth.backToLogin")}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function PasswordField({ label, value, onChange, visible, onToggle }) {
  const { t } = useLanguage();
  return (
    <label>
      {label}
      <span className="password-field">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${visible ? t("reset.hide") : t("reset.show")} ${label.toLowerCase()}`}
        >
          {visible ? t("reset.hide") : t("reset.show")}
        </button>
      </span>
    </label>
  );
}
