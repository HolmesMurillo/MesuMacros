import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./components/Catalog.css";
import "./components/Migration.css";
import { downloadBackup, loadData, saveData } from "./services/storage";
import { formatDateLabel, getLocalDateKey, getTimeZone } from "./utils/dateUtils";
import { sumNutrition } from "./utils/nutrition";
import { createId } from "./utils/id";
import { useAuth } from "./context/authContext";
import AuthScreen, { SupabaseSetup } from "./components/AuthScreen";
import AuthCallback from "./components/AuthCallback";
import ResetPassword from "./components/ResetPassword";
import AppIcon from "./components/AppIcon";
import HomePage from "./components/pages/HomePage";
import LogPage from "./components/pages/LogPage";
import HistoryPage from "./components/pages/HistoryPage";
import ProgressPage from "./components/pages/ProgressPage";
import ProfilePage from "./components/pages/ProfilePage";
import LanguageToggle from "./components/LanguageToggle";
import { useLanguage } from "./context/languageContext";
import {
  deleteAllTrackingData,
  deleteFoodEntry,
  deleteMeasurementEntry,
  deleteWaterEntry,
  insertMeasurementEntry,
  insertWaterEntry,
  loadUserData,
  migrateLegacyData,
  saveFoodEntry,
  syncUserData,
} from "./services/supabaseData";

function readableError(error, fallback, t) {
  const message = error?.message || "";
  if (/permission|policy|rls|row level security|403/i.test(message) || error?.status === 403) {
    return t("app.permissionError");
  }
  return message || fallback;
}

export default function App() {
  const auth = useAuth();
  const { locale, setLanguage, t } = useLanguage();
  const tabs = useMemo(() => [
    ["home", t("nav.home"), "home"],
    ["log", t("nav.log"), "plus"],
    ["history", t("nav.history"), "history"],
    ["progress", t("nav.progress"), "chart"],
    ["profile", t("nav.profile"), "user"],
  ], [t]);
  const demoMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("demo") === "1";
  const currentUser = auth.user || (demoMode ? { email: "demo@mesumacros.app" } : null);
  const [pathname, setPathname] = useState(window.location.pathname);
  const [data, setData] = useState(loadData);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey());
  const [notice, setNotice] = useState("");
  const [editingFood, setEditingFood] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [migrationPrompt, setMigrationPrompt] = useState(false);
  const [syncState, setSyncState] = useState("saved");
  const [legacyData] = useState(loadData);
  const fileInput = useRef(null);
  const translatorRef = useRef(t);
  const today = getLocalDateKey();
  const hasLegacyData = Boolean(legacyData.profile.name || legacyData.foods.length || legacyData.water.length || legacyData.measurements.length);

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  useEffect(() => { saveData(data); }, [data]);

  useEffect(() => { translatorRef.current = t; }, [t]);

  useEffect(() => {
    setLanguage(data.profile.language || "en");
  }, [data.profile.language, setLanguage]);

  useEffect(() => {
    const theme = data.profile.theme;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => { document.documentElement.dataset.theme = theme === "system" ? (media.matches ? "dark" : "light") : theme; };
    applyTheme();
    media.addEventListener?.("change", applyTheme);
    return () => media.removeEventListener?.("change", applyTheme);
  }, [data.profile.theme]);

  useEffect(() => {
    if (!auth.user || !auth.configured) return undefined;
    let cancelled = false;
    loadUserData(auth.user.id)
      .then((remoteData) => {
        if (!cancelled) {
          setData(remoteData);
          setRemoteLoaded(true);
          setMigrationPrompt(hasLegacyData && remoteData.foods.length === 0);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRemoteLoaded(true);
          setNotice(readableError(error, translatorRef.current("app.cloudFallback"), translatorRef.current));
        }
      });
    return () => { cancelled = true; };
  }, [auth.user, auth.configured, hasLegacyData]);

  useEffect(() => {
    if (!auth.user || !remoteLoaded) return undefined;
    const timer = window.setTimeout(() => {
      syncUserData(auth.user.id, data)
        .then(() => setSyncState("saved"))
        .catch(() => setSyncState("error"));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [auth.user, data, remoteLoaded]);

  const dayFoods = useMemo(() => data.foods.filter((food) => food.dateKey === selectedDate), [data.foods, selectedDate]);
  const totals = useMemo(() => sumNutrition(dayFoods), [dayFoods]);
  const updateProfile = (changes) => { setSyncState("saving"); setData((current) => ({ ...current, profile: { ...current.profile, ...changes } })); };
  const updateGoals = (changes) => { setSyncState("saving"); setData((current) => ({ ...current, goals: { ...current.goals, ...changes } })); };
  const flash = (message) => { setNotice(message); window.setTimeout(() => setNotice(""), 3600); };

  async function saveFood(food) {
    const now = new Date().toISOString();
    const existing = data.foods.find((item) => item.id === food.id);
    const record = {
      ...food,
      id: food.id || createId(),
      dateKey: food.dateKey || selectedDate,
      time: food.time || null,
      createdAt: food.createdAt || now,
      updatedAt: now,
      timeZone: food.timeZone || getTimeZone(),
      nutrients: Object.fromEntries(Object.entries(food.nutrients || {}).filter(([, value]) => value !== "" && value != null).map(([key, value]) => [key, Number(value)])),
    };
    const saved = auth.user && auth.configured ? await saveFoodEntry(record) : record;
    setData((current) => ({ ...current, foods: existing ? current.foods.map((item) => item.id === existing.id ? saved : item) : [...current.foods, saved] }));
    return saved;
  }

  async function removeFood(food) {
    if (!window.confirm(t("app.deleteFoodConfirm", { name: food.name }))) return;
    try {
      if (auth.user && auth.configured) await deleteFoodEntry(food);
      setData((current) => ({ ...current, foods: current.foods.filter((item) => item.id !== food.id) }));
      flash(t("app.foodDeleted"));
    } catch (error) { flash(readableError(error, t("app.foodDeleteFailed"), t)); }
  }

  async function addWater(amount) {
    const record = { id: createId(), dateKey: selectedDate, amount, createdAt: new Date().toISOString(), timeZone: getTimeZone() };
    try {
      const saved = auth.user && auth.configured ? await insertWaterEntry(record) : record;
      setData((current) => ({ ...current, water: [...current.water, saved] }));
      flash(t("app.waterAdded", { amount }));
    } catch (error) { flash(readableError(error, t("app.waterFailed"), t)); }
  }

  async function removeWater(entry) {
    try {
      if (auth.user && auth.configured) await deleteWaterEntry(entry);
      setData((current) => ({ ...current, water: current.water.filter((item) => item.id !== entry.id) }));
      flash(t("app.waterRemoved"));
    } catch (error) { flash(readableError(error, t("app.waterFailed"), t)); }
  }

  async function addMeasurement(values) {
    const record = { ...values, id: createId(), dateKey: values.dateKey || today, createdAt: new Date().toISOString(), timeZone: getTimeZone() };
    const saved = auth.user && auth.configured ? await insertMeasurementEntry(record) : record;
    setData((current) => ({ ...current, measurements: [...current.measurements, saved], profile: values.weight ? { ...current.profile, currentWeight: values.weight } : current.profile }));
    flash(t("app.measurementSaved"));
  }

  async function removeMeasurement(entry) {
    if (!window.confirm(t("app.measurementDeleteConfirm"))) return;
    try {
      if (auth.user && auth.configured) await deleteMeasurementEntry(entry);
      setData((current) => ({ ...current, measurements: current.measurements.filter((item) => item.id !== entry.id) }));
      flash(t("app.measurementDeleted"));
    } catch (error) { flash(readableError(error, t("app.measurementDeleteFailed"), t)); }
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.foods) || typeof parsed.profile !== "object") throw new Error("Formato inválido");
        setData((current) => ({ ...current, ...parsed, profile: { ...current.profile, ...parsed.profile }, goals: { ...current.goals, ...parsed.goals } }));
        flash(t("app.backupImported"));
      } catch { flash(t("app.invalidBackup")); }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  async function clearTracking() {
    if (!window.confirm(t("app.clearConfirm"))) return;
    try {
      if (auth.user && auth.configured) await deleteAllTrackingData();
      setData((current) => ({ ...current, foods: [], water: [], measurements: [] }));
      flash(t("app.trackingCleared"));
    } catch (error) { flash(readableError(error, t("app.trackingClearFailed"), t)); }
  }

  if (pathname === "/reset-password") return <ResetPassword />;
  if (pathname === "/auth/callback") return <AuthCallback />;
  if (!auth.configured && !demoMode) return <SupabaseSetup />;
  if (!demoMode && (auth.loading || (auth.user && !remoteLoaded))) return <main className="auth-shell"><LanguageToggle compact/><section className="auth-card auth-loading"><Brand /><div className="loading-orbit"/><p className="muted">{t("app.loading")}</p></section></main>;
  if (!currentUser) return <AuthScreen initialMode={pathname === "/register" ? "signup" : pathname === "/forgot" ? "forgot" : "login"} />;

  async function migrate() {
    setMigrationPrompt(false);
    try { await migrateLegacyData(auth.user.id); flash(t("app.localMigrated")); }
    catch { flash(t("app.localMigrationFailed")); }
  }

  const navigate = (tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <div className="app-shell">
      {migrationPrompt && <div className="migration-modal"><div className="migration-dialog"><span className="eyebrow">{t("app.firstLogin")}</span><h2>{t("app.foundLocal")}</h2><p className="muted">{t("app.migratePrompt")}</p><div className="data-actions"><button className="primary-button" onClick={migrate}>{t("app.saveToAccount")}</button><button className="outline-button" onClick={() => setMigrationPrompt(false)}>{t("app.notNow")}</button></div></div></div>}
      <aside className="sidebar">
        <Brand />
        <p className="tagline">{t("brand.tagline")}</p>
        <nav>{tabs.map(([id,label,icon]) => <button key={id} className={activeTab === id ? "nav-item active" : "nav-item"} onClick={() => navigate(id)}><span className="nav-icon"><AppIcon name={icon}/></span>{label}</button>)}</nav>
        <div className="sidebar-account"><div className="sidebar-avatar">{(data.profile.name || currentUser.email).charAt(0).toUpperCase()}</div><div><strong>{data.profile.name || t("app.myAccount")}</strong><span>{demoMode ? t("app.demo") : syncState === "saving" ? t("app.saving") : syncState === "error" ? t("app.offline") : t("app.synced")}</span></div><i className={syncState}/></div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><Brand /></div>
          <div><p className="eyebrow">{activeTab === "home" ? selectedDate === today ? t("app.todaySummary") : t("app.historicalView") : "MesuMacros"}</p><h1>{activeTab === "home" ? t("app.greeting", { name: data.profile.name?.split(" ")[0] || t("app.welcome") }) : tabs.find(([id]) => id === activeTab)?.[1]}</h1></div>
          <div className="top-actions"><LanguageToggle compact onChange={(next) => updateProfile({ language: next })}/><div className="top-date">{formatDateLabel(selectedDate, locale)}</div></div>
        </header>
        {notice && <div className="notice" role="status">{notice}</div>}
        {activeTab === "home" && <HomePage data={data} selectedDate={selectedDate} setSelectedDate={setSelectedDate} today={today} foods={dayFoods} totals={totals} onRegister={() => navigate("log")} onHistory={() => navigate("history")} onProgress={() => navigate("progress")} onAddWater={addWater} onRemoveWater={removeWater} />}
        {activeTab === "log" && <LogPage selectedDate={selectedDate} editingFood={editingFood} setEditingFood={setEditingFood} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} saveFood={saveFood} />}
        {activeTab === "history" && <HistoryPage foods={data.foods} goals={data.goals} selectedDate={selectedDate} setSelectedDate={setSelectedDate} onEdit={(food) => { setEditingFood(food); navigate("log"); }} onDelete={removeFood} onCopy={(food) => saveFood({ ...food, id: undefined, user_id: undefined, legacy_id: undefined, dateKey: selectedDate, createdAt: undefined }).then(() => flash(t("app.foodCopied"))).catch((error) => flash(readableError(error, t("app.foodCopyFailed"), t)))} onRegister={() => navigate("log")} />}
        {activeTab === "progress" && <ProgressPage data={data} onAddMeasurement={addMeasurement} onDeleteMeasurement={removeMeasurement} />}
        {activeTab === "profile" && <ProfilePage data={data} user={currentUser} updateProfile={updateProfile} updateGoals={updateGoals} onExport={() => downloadBackup(data)} onImport={() => fileInput.current?.click()} onClear={clearTracking} onSignOut={auth.signOut} />}
        <input ref={fileInput} className="visually-hidden" type="file" accept="application/json" onChange={importBackup} />
      </main>
      <nav className="bottom-nav">{tabs.map(([id,label,icon]) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => navigate(id)}><AppIcon name={icon}/><span>{label}</span></button>)}</nav>
    </div>
  );
}

function Brand() {
  return <div className="brand"><span className="brand-mark">M</span><span>Mesu<span>Macros</span></span></div>;
}
