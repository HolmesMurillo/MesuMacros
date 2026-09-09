import { Component } from "react";
import { useLanguage } from "../context/languageContext";

function ErrorFallback() {
  const { t } = useLanguage();
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">M</span>
          <span>Mesu<span>Macros</span></span>
        </div>
        <h1>{t("error.title")}</h1>
        <p className="muted">{t("error.text")}</p>
        <button className="primary-button" onClick={() => window.location.reload()}>{t("error.retry")}</button>
      </section>
    </main>
  );
}

export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}
