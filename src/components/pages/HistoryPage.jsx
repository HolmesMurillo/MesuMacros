import { useMemo, useState } from "react";
import AppIcon from "../AppIcon";
import { WeeklyBars } from "../NutritionCharts";
import { DatePicker, EmptyState, SegmentedControl } from "../ui";
import { formatMacro } from "../../utils/format";
import { dateKeysEndingAt, number, totalsForDate } from "../../utils/analytics";
import { formatDateLabel, getLocalDateKey } from "../../utils/dateUtils";
import { getMealLabels, sumNutrition } from "../../utils/nutrition";
import { useLanguage } from "../../context/languageContext";

export default function HistoryPage({ foods, goals, selectedDate, setSelectedDate, onEdit, onDelete, onCopy, onRegister }) {
  const { language, locale, t } = useLanguage();
  const mealLabels = useMemo(() => getMealLabels(t), [t]);
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState("all");
  const [range, setRange] = useState("day");
  const days = range === "month" ? 30 : range === "week" ? 7 : 1;
  const dateKeys = useMemo(() => dateKeysEndingAt(selectedDate, days), [selectedDate, days]);
  const filtered = useMemo(() => foods.filter((food) =>
    dateKeys.includes(food.dateKey) &&
    (meal === "all" || food.mealType === meal) &&
    food.name.toLowerCase().includes(query.trim().toLowerCase()),
  ), [foods, dateKeys, meal, query]);
  const groups = [...dateKeys].reverse().map((dateKey) => ({
    dateKey,
    foods: filtered.filter((food) => food.dateKey === dateKey),
    totals: totalsForDate(filtered, dateKey),
  })).filter((group) => group.foods.length > 0);
  const periodTotals = sumNutrition(filtered);
  const activeDays = new Set(filtered.map((food) => food.dateKey)).size;
  const dailyAverage = activeDays ? periodTotals.calories / activeDays : 0;
  const chartSeries = dateKeys.slice(-7).map((dateKey) => ({ dateKey, ...totalsForDate(foods, dateKey) }));

  return (
    <section className="page-stack">
      <div className="history-toolbar">
        <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} today={getLocalDateKey()} />
        <SegmentedControl value={range} onChange={setRange} label={t("history.range")} options={[["day",t("history.day")],["week",t("history.sevenDays")],["month",t("history.thirtyDays")]]} />
      </div>

      <div className="history-summary-grid">
        <div className="summary-tile"><span>{t("history.caloriesLogged")}</span><strong>{Math.round(periodTotals.calories)} <small>kcal</small></strong></div>
        <div className="summary-tile"><span>{t("history.dailyAverage")}</span><strong>{Math.round(dailyAverage)} <small>kcal</small></strong></div>
        <div className="summary-tile"><span>{t("history.daysLogged")}</span><strong>{activeDays} <small>{t("history.ofDays", { days })}</small></strong></div>
        <div className="summary-tile"><span>{t("history.foods")}</span><strong>{filtered.length} <small>{t("common.entries")}</small></strong></div>
      </div>

      {range !== "day" && <article className="panel history-chart-panel"><div className="section-heading"><div><span className="eyebrow">{t("history.quickView")}</span><h2>{t("history.lastWeekCalories")}</h2></div><small>{t("history.goalLine")}</small></div><WeeklyBars series={chartSeries} goal={goals.calories} /></article>}

      <article className="panel history-panel">
        <div className="history-filterbar">
          <div><span className="eyebrow">{t("history.nutritionLog")}</span><h2>{range === "day" ? t("history.dayDetail") : t("history.periodDetail", { days })}</h2></div>
          <label className="search"><AppIcon name="search" size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("history.searchFood")} /></label>
          <select className="meal-filter" aria-label={t("history.filterMeal")} value={meal} onChange={(event) => setMeal(event.target.value)}><option value="all">{t("meal.all")}</option>{Object.entries(mealLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select>
        </div>
        {groups.length ? <div className="history-groups">{groups.map((group) => (
          <section className="history-day" key={group.dateKey}>
            <header><div><strong>{group.dateKey === getLocalDateKey() ? t("history.today") : formatDateLabel(group.dateKey, locale)}</strong><span>{t("history.foodCount", { count: group.foods.length })}</span></div><div className="day-macros"><b>{Math.round(group.totals.calories)} kcal</b><span>P {formatMacro(group.totals.protein)} · C {formatMacro(group.totals.carbs)} · {language === "es" ? "G" : "F"} {formatMacro(group.totals.fat)}</span></div></header>
            <div className="history-list">{group.foods.map((food) => (
              <div className="history-row" key={food.id}>
                <div className="food-avatar">{food.name.charAt(0).toUpperCase()}</div>
                <div className="history-main"><strong>{food.name}</strong><span>{mealLabels[food.mealType] || t("common.food")} · {food.amount}{food.unit}{food.time ? ` · ${food.time}` : ""}</span></div>
                <div className="history-macros"><b>{Math.round(number(food.calories))} kcal</b><span>P {formatMacro(food.protein)} · C {formatMacro(food.carbs)} · {language === "es" ? "G" : "F"} {formatMacro(food.fat)}</span></div>
                <div className="row-actions"><button title={t("history.copyTitle")} aria-label={t("history.copy")} onClick={() => onCopy(food)}><AppIcon name="copy" size={17}/></button><button title={t("history.edit")} aria-label={t("history.edit")} onClick={() => onEdit(food)}><AppIcon name="edit" size={17}/></button><button className="delete-action" title={t("history.delete")} aria-label={t("history.delete")} onClick={() => onDelete(food)}><AppIcon name="trash" size={17}/></button></div>
              </div>
            ))}</div>
          </section>
        ))}</div> : <EmptyState icon="history" title={t("history.emptyTitle")} action={<button className="primary-button" onClick={onRegister}>{t("log.logFood")}</button>}>{t("history.emptyText")}</EmptyState>}
      </article>
    </section>
  );
}
