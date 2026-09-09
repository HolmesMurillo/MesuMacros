import { useMemo } from "react";
import AppIcon from "../AppIcon";
import { WeeklyBars } from "../NutritionCharts";
import { DatePicker, EmptyState, MacroStat, ProgressBar } from "../ui";
import { buildDailySeries, currentStreak, number } from "../../utils/analytics";
import { getMealLabels } from "../../utils/nutrition";
import { useLanguage } from "../../context/languageContext";

function goalRatio(value, goal) {
  return goal ? Math.min(1, number(value) / number(goal)) : 0;
}

export default function HomePage({
  data,
  selectedDate,
  setSelectedDate,
  today,
  foods,
  totals,
  onRegister,
  onHistory,
  onProgress,
  onAddWater,
  onRemoveWater,
}) {
  const { t } = useLanguage();
  const mealLabels = useMemo(() => getMealLabels(t), [t]);
  const goals = data.goals;
  const water = data.water.filter((item) => item.dateKey === selectedDate);
  const waterTotal = water.reduce((sum, item) => sum + number(item.amount), 0);
  const remaining = Math.max(0, number(goals.calories) - totals.calories);
  const caloriePercent = goals.calories ? Math.round((totals.calories / goals.calories) * 100) : 0;
  const fiber = number(totals.fiber);
  const dailyScore = Math.round(
    ((goalRatio(totals.calories, goals.calories) +
      goalRatio(totals.protein, goals.protein) +
      goalRatio(fiber, goals.fiber) +
      goalRatio(waterTotal, goals.water)) /
      4) *
      100,
  );
  const week = buildDailySeries(data, selectedDate, 7);
  const streak = currentStreak(data.foods, today);
  const insight =
    foods.length === 0
      ? t("home.insightEmpty")
      : totals.protein < goals.protein * 0.65
        ? t("home.insightProtein", { amount: Math.max(0, Math.round(goals.protein - totals.protein)) })
        : waterTotal < goals.water * 0.65
          ? t("home.insightWater")
          : caloriePercent > 110
            ? t("home.insightCalories")
            : t("home.insightBalanced");

  return (
    <section className="page-stack">
      <div className="page-tools">
        <DatePicker {...{ selectedDate, setSelectedDate, today }} />
        <button className="primary-button quick-add" onClick={onRegister}><AppIcon name="plus" size={17} /> {t("home.logMeal")}</button>
      </div>

      <div className="hero-grid home-hero">
        <article className="calorie-card">
          <div className="calorie-copy">
            <span className="card-kicker">{t("home.energyBalance")}</span>
            <div className="calories"><strong>{Math.round(totals.calories)}</strong><span>kcal<br/><small>{t("home.consumed")}</small></span></div>
            <p>{remaining ? t("home.available", { amount: remaining }) : t("home.goalComplete")}</p>
            <button type="button" onClick={onHistory}>{t("home.dayDetails")}</button>
          </div>
          <div className="ring" style={{ "--progress": `${Math.min(100, caloriePercent)}%` }}><span>{caloriePercent}<small>%</small></span></div>
        </article>

        <article className="panel today-score-card">
          <div className="score-top"><span className="stat-icon green"><AppIcon name="spark" /></span><div><span className="card-kicker">{t("home.todayScore")}</span><h2>{dailyScore}/100</h2></div><span className={`score-badge ${dailyScore >= 75 ? "good" : ""}`}>{dailyScore >= 75 ? t("home.scoreGreat") : dailyScore >= 45 ? t("home.scoreProgress") : t("home.scoreStart")}</span></div>
          <p className="muted">{t("home.scoreExplain")}</p>
          <ProgressBar value={dailyScore} goal={100} />
          <div className="mini-metrics"><span><strong>{streak}</strong> {t("home.streak")}</span><span><strong>{foods.length}</strong> {t("home.foodsToday")}</span></div>
        </article>
      </div>

      <div className="macro-grid">
        <MacroStat label={t("macro.protein")} value={totals.protein} goal={goals.protein} color="green" icon="target" />
        <MacroStat label={t("macro.carbs")} value={totals.carbs} goal={goals.carbs} color="orange" icon="flame" />
        <MacroStat label={t("macro.fat")} value={totals.fat} goal={goals.fat} color="blue" icon="spark" />
      </div>

      <div className="content-grid home-content">
        <article className="panel meal-panel">
          <div className="section-heading"><div><span className="eyebrow">{foods.length} {t("home.records")}</span><h2>{t("home.mealsToday")}</h2></div><button className="text-button" onClick={onRegister}>{t("home.add")}</button></div>
          {foods.length ? (
            <div className="meal-list">
              {Object.entries(mealLabels).map(([type, label]) => {
                const entries = foods.filter((food) => food.mealType === type);
                if (!entries.length) return null;
                const mealCalories = entries.reduce((sum, item) => sum + number(item.calories), 0);
                return <div className="meal-group" key={type}><div className="meal-heading"><h3>{label}</h3><span>{Math.round(mealCalories)} kcal</span></div>{entries.map((food) => <div className="meal-line" key={food.id}><span className="meal-dot"/><div><strong>{food.name}</strong><small>{food.amount}{food.unit}{food.time ? ` · ${food.time}` : ""}</small></div><b>{Math.round(number(food.calories))} kcal</b></div>)}</div>;
              })}
              <button className="outline-button full" onClick={onHistory}>{t("home.openHistory")}</button>
            </div>
          ) : <EmptyState icon="plus" title={t("home.emptyTitle")} action={<button className="primary-button" onClick={onRegister}>{t("home.logFirst")}</button>}>{t("home.emptyDetail")}</EmptyState>}
        </article>

        <div className="side-stack">
          <article className="panel hydration-card">
            <div className="card-heading"><span className="stat-icon blue"><AppIcon name="water" /></span><div><span className="eyebrow">{t("home.hydration")}</span><h2>{t("macro.water")}</h2></div><strong>{waterTotal}<small> / {goals.water} ml</small></strong></div>
            <ProgressBar value={waterTotal} goal={goals.water} color="blue" />
            <div className="water-actions"><button onClick={() => onAddWater(250)}>+ 250 ml</button><button onClick={() => onAddWater(500)}>+ 500 ml</button>{water.length > 0 && <button className="water-undo" onClick={() => onRemoveWater(water.at(-1))}>{t("home.undo")}</button>}</div>
          </article>
          <article className="panel insight-card"><span className="stat-icon lime"><AppIcon name="spark" /></span><div><span className="eyebrow">{t("home.nextStep")}</span><h2>{t("home.recommendation")}</h2><p>{insight}</p></div></article>
        </div>
      </div>

      <article className="panel weekly-card">
        <div className="section-heading"><div><span className="eyebrow">{t("home.lastSeven")}</span><h2>{t("home.weeklyPace")}</h2></div><button className="text-button" onClick={onProgress}>{t("home.viewProgress")}</button></div>
        <WeeklyBars series={week} goal={goals.calories} />
      </article>
    </section>
  );
}
