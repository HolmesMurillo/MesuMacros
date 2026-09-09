import AppIcon from "./AppIcon";
import { formatDateLabel, shiftDateKey } from "../utils/dateUtils";
import { useLanguage } from "../context/languageContext";

export function DatePicker({ selectedDate, setSelectedDate, today }) {
  const { locale, t } = useLanguage();
  return (
    <div className="date-picker" aria-label={t("date.picker")}>
      <button type="button" aria-label={t("date.previous")} onClick={() => setSelectedDate(shiftDateKey(selectedDate, -1))}>←</button>
      <strong>{selectedDate === today ? t("date.today") : formatDateLabel(selectedDate, locale)}</strong>
      <button type="button" aria-label={t("date.next")} onClick={() => setSelectedDate(shiftDateKey(selectedDate, 1))}>→</button>
      {selectedDate !== today && <button type="button" className="today-button" onClick={() => setSelectedDate(today)}>{t("date.backToday")}</button>}
    </div>
  );
}

export function ProgressBar({ value, goal, color = "green" }) {
  const percent = goal ? Math.min(100, Math.max(0, (Number(value) / Number(goal)) * 100)) : 0;
  return <div className="progress-track" aria-label={`${Math.round(percent)}%`}><div className={`progress-fill ${color}`} style={{ width: `${percent}%` }} /></div>;
}

export function MacroStat({ label, value, goal, unit = "g", color, icon }) {
  const percent = goal ? Math.round((Number(value) / Number(goal)) * 100) : 0;
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><AppIcon name={icon || "target"} size={18} /></div>
      <div className="stat-copy"><span>{label}</span><strong>{Math.round(value)} <small>/ {goal}{unit}</small></strong></div>
      <span className="stat-percent">{percent}%</span>
      <ProgressBar value={value} goal={goal} color={color} />
    </div>
  );
}

export function EmptyState({ icon = "spark", title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><AppIcon name={icon} /></span>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function SegmentedControl({ value, onChange, options, label }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(([key, text]) => <button key={key} type="button" className={value === key ? "active" : ""} onClick={() => onChange(key)}>{text}</button>)}
    </div>
  );
}
