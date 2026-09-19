import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/languageContext";
import LanguageToggle from "./LanguageToggle";
import "./AuthScreen.css";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function AuthScreen({
  recovery = false,
  initialMode = "login",
}) {
  const auth = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState(recovery ? "recovery" : initialMode);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() =>
    new URLSearchParams(window.location.search).get("password") === "updated"
      ? t("auth.passwordUpdated")
      : "",
  );
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [resendWait, setResendWait] = useState(0);
  const set = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  useEffect(() => {
    if (!resendWait) return undefined;
    const timer = window.setInterval(
      () => setResendWait((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resendWait]);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (mode !== "forgot" && mode !== "recovery" && !form.email.includes("@"))
      return setError(t("auth.invalidEmail"));
    if (mode === "signup" && form.password !== form.confirm)
      return setError(t("auth.passwordMismatch"));
    if ((mode === "signup" || mode === "recovery") && form.password.length < 8)
      return setError(t("auth.passwordLength"));
    if (mode === "signup" && !accepted)
      return setError(t("auth.acceptRequired"));
    setBusy(true);
    let result;
    try {
      if (mode === "login")
        result = await auth.signIn(form.email, form.password);
      if (mode === "signup")
        result = await auth.signUp(form.email, form.password, form.name);
      if (mode === "forgot") result = await auth.resetPassword(form.email);
      if (mode === "recovery")
        result = await auth.updatePassword(form.password);
    } catch {
      result = {
        error: {
          message: t("auth.requestFailed"),
        },
      };
    } finally {
      setBusy(false);
    }
    if (result?.error)
      setError(
        typeof result.error === "string" ? result.error : result.error.message,
      );
    else if (mode === "signup") navigate("/register?confirmed=0");
    else if (mode === "forgot")
      setMessage(
        t("auth.resetSent"),
      );
    else if (mode === "recovery") {
      setMessage(t("auth.updatedContinue"));
      setMode("login");
    }
  };
  const resend = async () => {
    if (resendWait || busy) return;
    setBusy(true);
    const result = await auth.resendConfirmation(form.email);
    setBusy(false);
    setResendWait(60);
    setMessage(
      result.error
        ? result.error.message
        : t("auth.resendGeneric"),
    );
  };
  if (
    mode === "signup" &&
    new URLSearchParams(window.location.search).get("confirmed") === "0"
  )
    return (
      <ConfirmationView
        email={form.email}
        resend={resend}
        busy={busy}
        wait={resendWait}
        onLogin={() => navigate("/login")}
        message={message}
        error={error}
      />
    );
  const title =
    mode === "login"
      ? t("auth.welcome")
      : mode === "signup"
        ? t("auth.createAccount")
        : mode === "forgot"
          ? t("auth.recoverAccess")
          : t("auth.newPassword");
  const action =
    mode === "login"
      ? t("auth.signIn")
      : mode === "signup"
        ? t("auth.createMyAccount")
        : mode === "forgot"
          ? t("auth.sendInstructions")
          : t("auth.savePassword");
  return (
    <main className={`auth-shell ${mode === "signup" ? "register-shell" : ""}`}>
      <LanguageToggle compact />
      <section className="auth-card">
        <div className="auth-panel">
          <div className="brand auth-brand">
            <span className="brand-mark">M</span>
            <span>
              Mesu<span>Macros</span>
            </span>
          </div>
          {mode === "signup" && <span className="eyebrow">{t("auth.newAccount")}</span>}
          <div className="auth-heading">
            <h1>{title}</h1>
            <p className="muted">
              {mode === "login"
                ? t("auth.loginDescription")
                : mode === "signup"
                  ? t("auth.signupDescription")
                  : mode === "forgot"
                    ? t("auth.forgotDescription")
                    : t("auth.recoveryDescription")}
            </p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode === "signup" && (
              <label>
                {t("auth.name")}
                <input
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
            )}
            {mode !== "recovery" && (
              <label>
                {t("auth.email")}
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
            )}
            {mode !== "forgot" && (
              <label>
                {t("auth.password")}
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => set("password", event.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                />
              </label>
            )}
            {mode === "signup" && (
              <>
                <label>
                  {t("auth.confirmPassword")}
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(event) => set("confirm", event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <PasswordRules password={form.password} />
                <label className="terms">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                  />{" "}
                  {t("auth.acceptTerms")}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">Terms / Términos</a>
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy / Privacidad</a>
                </label>
              </>
            )}
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
              {busy ? t("common.processing") : action}
            </button>
          </form>
          <div className="auth-links">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")}>
                  {t("auth.forgotPassword")}
                </button>
                <button
                  onClick={() => {
                    setMode("signup");
                    navigate("/register");
                  }}
                >
                  {t("auth.noAccount")}
                </button>
              </>
            )}
            {mode === "signup" && (
              <button
                onClick={() => {
                  setMode("login");
                  navigate("/login");
                }}
              >
                {t("auth.haveAccount")}
              </button>
            )}
            {mode === "recovery" && (
              <button onClick={() => navigate("/login")}>
                {t("auth.backToLogin")}
              </button>
            )}
          </div>
        </div>
        {mode === "signup" && (
          <aside className="auth-aside">
            <span className="nutrition-symbol">✦</span>
            <strong>{t("auth.asideTitle")}</strong>
            <span>{t("auth.asideText")}</span>
          </aside>
        )}
      </section>
    </main>
  );
}

function PasswordRules({ password }) {
  const { t } = useLanguage();
  const rules = [
    [password.length >= 8, t("auth.ruleLength")],
    [/[A-Z]/.test(password), t("auth.ruleUppercase")],
    [/[0-9]/.test(password), t("auth.ruleNumber")],
  ];
  return (
    <ul className="password-rules">
      {rules.map(([valid, text]) => (
        <li key={text} className={valid ? "valid" : ""}>
          {valid ? "✓" : "○"} {text}
        </li>
      ))}
    </ul>
  );
}

function ConfirmationView({
  email,
  resend,
  busy,
  wait,
  onLogin,
  message,
  error,
}) {
  const { t } = useLanguage();
  return (
    <main className="auth-shell">
      <LanguageToggle compact />
      <section className="auth-card confirmation-card">
        <div className="mail-icon" aria-hidden="true">
          @
        </div>
        <span className="eyebrow">{t("auth.checkEmail")}</span>
        <h1>{t("auth.confirmAccount")}</h1>
        <p className="muted">{t("auth.sentTo")}</p>
        <strong>{email || t("auth.yourEmail")}</strong>
        <p>{t("auth.confirmInstructions")}</p>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}
        <button
          className="outline-button"
          onClick={resend}
          disabled={busy || wait}
        >
          {wait ? t("auth.resendIn", { seconds: wait }) : t("auth.resend")}
        </button>
        <button className="text-button" onClick={onLogin}>
          {t("auth.backToLogin")}
        </button>
        <small>{t("auth.checkSpam")}</small>
      </section>
    </main>
  );
}

export function SupabaseSetup() {
  const { t } = useLanguage();
  return (
    <main className="auth-shell">
      <LanguageToggle compact />
      <section className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">M</span>
          <span>
            Mesu<span>Macros</span>
          </span>
        </div>
        <p className="tagline auth-tagline">{t("brand.tagline")}</p>
        <h1>{t("auth.setupTitle")}</h1>
        <p className="muted">{t("auth.setupMissing")}</p>
        <p className="estimate-note">{t("auth.setupSafe")}</p>
      </section>
    </main>
  );
}
