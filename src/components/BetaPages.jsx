import { useState } from "react";
import { useLanguage } from "../context/languageContext";
import LanguageToggle from "./LanguageToggle";
import "./AuthScreen.css";

export function BetaLinks() {
  const { language } = useLanguage();
  const es = language === "es";
  return <nav aria-label="Beta" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "16px 0" }}>
    <span>Beta</span>
    <a href="/privacy" target="_blank" rel="noopener noreferrer">{es ? "Privacidad" : "Privacy"}</a>
    <a href="/terms" target="_blank" rel="noopener noreferrer">{es ? "Términos" : "Terms"}</a>
    <a href="/feedback" target="_blank" rel="noopener noreferrer">{es ? "Reportar un problema" : "Report an issue"}</a>
  </nav>;
}

export default function BetaPages({ page }) {
  const { language } = useLanguage();
  const es = language === "es";
  const [report, setReport] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  function download(event) {
    event.preventDefault();
    const blob = new Blob([`MesuMacros beta report\n${new Date().toISOString()}\n\n${report}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mesumacros-beta-report.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }
  const privacy = es ? [
    ["Datos y finalidad", "La aplicación usa tu correo y sesión para identificar tu cuenta. Guarda los datos que introduces: perfil, objetivos nutricionales, alimentos, agua y medidas corporales, para mostrar tu seguimiento y sincronizarlo."],
    ["Servicios y almacenamiento", "Supabase gestiona las cuentas y la base de datos; Netlify aloja la web; Brevo entrega correos de autenticación. La búsqueda MESU food search envía el texto buscado a USDA FoodData Central mediante una función de Supabase. Estos servicios pueden conservar registros técnicos de las solicitudes."],
    ["En tu navegador", "Se conservan una sesión y copias locales por cuenta. Los archivos de la aplicación pueden almacenarse para facilitar su carga. En dispositivos compartidos, cierra sesión y borra los datos del sitio al terminar. Las copias JSON que exportes quedan bajo tu control."],
    ["Tus opciones", "Puedes editar el perfil, exportar un respaldo y borrar el seguimiento desde Perfil. Borrar el seguimiento no elimina la cuenta, el perfil ni las metas. Para solicitar la eliminación completa, escribe a murillocuello22@gmail.com. Las copias de seguridad y registros de los proveedores pueden tener plazos de conservación distintos."],
    ["Reportes", "El formulario de problemas descarga un archivo; no lo envía automáticamente. Revísalo y envíalo voluntariamente a murillocuello22@gmail.com. No incluyas contraseñas, enlaces de recuperación ni datos de salud que no sean necesarios."],
  ] : [
    ["Data and purpose", "The app uses your email and session to identify your account. It stores the information you enter: profile, nutrition goals, food, water and body measurements, to display and synchronize your tracking."],
    ["Services and storage", "Supabase handles accounts and the database; Netlify hosts the website; Brevo delivers authentication emails. MESU food search sends your search text to USDA FoodData Central through a Supabase function. These services may retain technical request logs."],
    ["In your browser", "A session and per-account local copies are retained. Application files may be cached to help loading. On shared devices, sign out and clear site data when finished. Exported JSON backups remain under your control."],
    ["Your choices", "You can edit your profile, export a backup and clear tracking in Profile. Clearing tracking does not delete your account, profile or goals. To request full deletion, email murillocuello22@gmail.com. Provider backups and logs may follow different retention periods."],
    ["Reports", "The issue form downloads a file; it does not send it automatically. Review it and voluntarily email it to murillocuello22@gmail.com. Do not include passwords, recovery links or unnecessary health information."],
  ];
  const terms = es ? [
    ["Prueba beta", "MesuMacros es una aplicación experimental de seguimiento nutricional. Puede contener errores, sufrir interrupciones o perder datos. Conserva un respaldo de lo que necesites."],
    ["No es atención médica", "Los valores nutricionales, cálculos, puntuaciones y recomendaciones son estimaciones informativas. No diagnostican ni tratan enfermedades y no sustituyen el consejo de profesionales de salud o nutrición."],
    ["Uso responsable", "Protege tus credenciales. No introduzcas datos de otras personas sin autorización ni intentes acceder a cuentas ajenas. Reporta cualquier problema de privacidad a murillocuello22@gmail.com, sin compartir datos de otros usuarios."],
    ["Cambios y contacto", "Las funciones pueden cambiar durante la beta. Puedes dejar de participar en cualquier momento y solicitar ayuda o la eliminación de tu cuenta escribiendo a murillocuello22@gmail.com."],
  ] : [
    ["Beta testing", "MesuMacros is an experimental nutrition tracking application. It may contain errors, experience interruptions or lose data. Keep a backup of information you need."],
    ["Not medical care", "Nutrition values, calculations, scores and recommendations are informational estimates. They do not diagnose or treat illness and do not replace professional health or nutrition advice."],
    ["Responsible use", "Protect your credentials. Do not enter other people's data without authorization or attempt to access other accounts. Report privacy issues to murillocuello22@gmail.com without sharing other users' data."],
    ["Changes and contact", "Features may change during the beta. You can stop participating at any time and request help or account deletion by emailing murillocuello22@gmail.com."],
  ];
  return <main className="auth-shell"><section className="auth-card" style={{ maxWidth: 800, width: "100%" }}><div className="auth-panel" style={{ width: "100%" }}>
    <LanguageToggle compact />
    <h1>{page === "/feedback" ? (es ? "Reportar un problema" : "Report an issue") : page === "/privacy" ? (es ? "Privacidad" : "Privacy") : (es ? "Términos de la beta" : "Beta terms")}</h1>
    {page !== "/feedback" && <><p className="notice">{es ? "Borrador para revisión del responsable antes de invitar participantes. Versión: 13 de septiembre de 2026." : "Draft for owner review before inviting participants. Version: September 13, 2026."}</p>{(page === "/privacy" ? privacy : terms).map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}</>}
    {page === "/feedback" && <form onSubmit={download} className="auth-form">
      <p>{es ? "Describe qué intentaste hacer, qué ocurrió, qué esperabas y qué teléfono/navegador usabas. No incluyas claves ni enlaces privados." : "Describe what you tried, what happened, what you expected and your phone/browser. Do not include secrets or private links."}</p>
      <label>{es ? "Tu reporte" : "Your report"}<textarea required minLength={10} maxLength={5000} rows={9} value={report} onChange={e => { setReport(e.target.value); setDownloaded(false); }} /></label>
      <button className="primary-button">{es ? "Descargar reporte" : "Download report"}</button>
      {downloaded && <p role="status">{es ? "Reporte preparado. No se ha enviado. Puedes enviarlo a murillocuello22@gmail.com." : "Report prepared. It has not been sent. You can email it to murillocuello22@gmail.com."}</p>}
    </form>}
    <p>{es ? "Soporte y solicitudes de eliminación: " : "Support and deletion requests: "}<a href="mailto:murillocuello22@gmail.com">murillocuello22@gmail.com</a></p>
    <BetaLinks /><a href="/">{es ? "Volver a MesuMacros" : "Back to MesuMacros"}</a>
  </div></section></main>;
}
