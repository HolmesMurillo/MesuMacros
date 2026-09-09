import AppIcon from "../AppIcon";
import { calculateGoals } from "../../utils/nutrition";
import { useLanguage } from "../../context/languageContext";

export default function ProfilePage({ data, user, updateProfile, updateGoals, onExport, onImport, onClear, onSignOut }) {
  const { t } = useLanguage();
  const profile = data.profile;
  const estimate = calculateGoals(profile);
  const required = ["name", "age", "height", "currentWeight", "targetWeight", "sex", "activity", "goal"];
  const completion = Math.round((required.filter((key) => profile[key] !== "" && profile[key] != null).length / required.length) * 100);
  const initial = (profile.name || user?.email || "M").charAt(0).toUpperCase();
  return (
    <section className="page-stack narrow profile-page">
      <article className="profile-hero panel">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-identity"><span className="eyebrow">{t("profile.yourAccount")}</span><h2>{profile.name || t("profile.completeProfile")}</h2><p>{user?.email}</p></div>
        <div className="profile-completion"><strong>{completion}%</strong><span>{t("profile.profileComplete")}</span><div className="progress-track"><div className="progress-fill" style={{ width: `${completion}%` }}/></div></div>
      </article>

      <article className="panel profile-panel">
        <div className="section-heading"><div><span className="eyebrow">{t("profile.personalInfo")}</span><h2>{t("profile.personalizeGoals")}</h2></div><span className="autosave"><i/> {t("profile.autoSaved")}</span></div>
        <p className="muted section-description">{t("profile.description")}</p>
        <div className="form-grid three">
          <label>{t("profile.name")}<input type="text" value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} placeholder={t("profile.namePlaceholder")} /></label>
          <label>{t("profile.age")}<input type="number" min="13" max="120" value={profile.age} onChange={(event) => updateProfile({ age: event.target.value })} placeholder={t("profile.years")} /></label>
          <label>{t("profile.sex")}<select value={profile.sex} onChange={(event) => updateProfile({ sex: event.target.value })}><option value="">{t("profile.preferNot")}</option><option value="female">{t("profile.female")}</option><option value="male">{t("profile.male")}</option></select></label>
          <label>{t("profile.height")}<input type="number" min="50" max="260" step="any" value={profile.height} onChange={(event) => updateProfile({ height: event.target.value })} placeholder="cm" /></label>
          <label>{t("profile.currentWeight")}<input type="number" min="20" max="500" step="any" value={profile.currentWeight} onChange={(event) => updateProfile({ currentWeight: event.target.value })} placeholder="kg" /></label>
          <label>{t("profile.targetWeight")}<input type="number" min="20" max="500" step="any" value={profile.targetWeight} onChange={(event) => updateProfile({ targetWeight: event.target.value })} placeholder="kg" /></label>
          <label>{t("profile.activity")}<select value={profile.activity} onChange={(event) => updateProfile({ activity: event.target.value })}><option value="low">{t("profile.low")}</option><option value="light">{t("profile.light")}</option><option value="moderate">{t("profile.moderate")}</option><option value="high">{t("profile.high")}</option></select></label>
          <label>{t("profile.mainGoal")}<select value={profile.goal} onChange={(event) => updateProfile({ goal: event.target.value })}><option value="lose">{t("profile.lose")}</option><option value="maintain">{t("profile.maintain")}</option><option value="gain">{t("profile.gain")}</option></select></label>
          <label>{t("profile.weeklyPace")}<select value={profile.pace} onChange={(event) => updateProfile({ pace: event.target.value })}><option value="0.25">{t("profile.paceGentle")}</option><option value="0.5">{t("profile.paceModerate")}</option><option value="0.75">{t("profile.paceFast")}</option></select></label>
        </div>
      </article>

      <article className="panel goals-panel">
        <div className="section-heading"><div><span className="eyebrow">{t("profile.dailyGoals")}</span><h2>{t("profile.nutritionGoals")}</h2></div>{estimate && <button className="outline-button" onClick={() => updateGoals(estimate)}><AppIcon name="spark" size={16}/> {t("profile.useRecommendation")}</button>}</div>
        {estimate ? <div className="estimate-note"><AppIcon name="target"/><span><strong>{t("profile.estimateAvailable")}</strong> {t("profile.maintenance", { calories: estimate.maintenance })}</span></div> : <div className="estimate-note"><AppIcon name="spark"/><span>{t("profile.completeForEstimate")}</span></div>}
        <div className="form-grid three">{[["calories","macro.calories","kcal"],["protein","macro.protein","g"],["carbs","macro.carbs","g"],["fat","macro.fat","g"],["fiber","macro.fiber","g"],["water","macro.water","ml"]].map(([key,label,unit]) => <label key={key}>{t(label)} <small>({unit})</small><input type="number" min="0" step="any" value={data.goals[key]} onChange={(event) => updateGoals({ [key]: event.target.value })} /></label>)}</div>
        <p className="health-note">{t("profile.healthNote")}</p>
      </article>

      <div className="profile-settings-grid">
        <article className="panel preferences-panel"><span className="eyebrow">{t("profile.experience")}</span><h2>{t("profile.preferences")}</h2><div className="settings-list">
          <label><span><AppIcon name="moon"/><b>{t("profile.appearance")}</b><small>{t("profile.appearanceHelp")}</small></span><select value={profile.theme} onChange={(event) => updateProfile({ theme: event.target.value })}><option value="light">{t("profile.lightTheme")}</option><option value="dark">{t("profile.darkTheme")}</option><option value="system">{t("profile.systemTheme")}</option></select></label>
          <label><span><AppIcon name="spark"/><b>{t("profile.units")}</b><small>{t("profile.unitsHelp")}</small></span><select value={profile.units} onChange={(event) => updateProfile({ units: event.target.value })}><option value="metric">{t("profile.metric")}</option><option value="imperial">{t("profile.imperial")}</option></select></label>
          <label><span><AppIcon name="user"/><b>{t("profile.language")}</b><small>{t("profile.languageHelp")}</small></span><select value={profile.language} onChange={(event) => updateProfile({ language: event.target.value })}><option value="en">English</option><option value="es">Español</option></select></label>
        </div></article>

        <article className="panel data-panel"><span className="eyebrow">{t("profile.privacy")}</span><h2>{t("profile.yourData")}</h2><p className="muted">{t("profile.dataDescription")}</p><div className="data-actions"><button className="outline-button" onClick={onExport}><AppIcon name="download" size={16}/> {t("profile.export")}</button><button className="outline-button" onClick={onImport}><AppIcon name="upload" size={16}/> {t("profile.import")}</button><button className="outline-button" onClick={onSignOut}><AppIcon name="logout" size={16}/> {t("profile.signOut")}</button><button className="danger-button" onClick={onClear}><AppIcon name="trash" size={16}/> {t("profile.deleteData")}</button></div></article>
      </div>
    </section>
  );
}
