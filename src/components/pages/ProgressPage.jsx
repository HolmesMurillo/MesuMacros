import { useMemo, useState } from "react";
import AppIcon from "../AppIcon";
import { LineChart, RadarChart, WeeklyBars } from "../NutritionCharts";
import { EmptyState, SegmentedControl } from "../ui";
import {
  adherenceStats,
  buildDailySeries,
  number,
  periodSummary,
  sortedMeasurements,
  weightChange,
} from "../../utils/analytics";
import { formatDateLabel, getLocalDateKey } from "../../utils/dateUtils";
import { useLanguage } from "../../context/languageContext";
import { buildRadarAxes } from "../../utils/radar";

export default function ProgressPage({
  data,
  onAddMeasurement,
  onDeleteMeasurement,
}) {
  const { locale, t } = useLanguage();
  const [period, setPeriod] = useState("today");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const summary = useMemo(() => periodSummary(data, period), [data, period]);
  const axes = buildRadarAxes(summary.average, data.goals, t, number);
  const measurements = sortedMeasurements(data.measurements);
  const change = weightChange(measurements);
  const latest = [...measurements]
    .reverse()
    .find((item) => number(item.weight) > 0);
  const adherence = adherenceStats(data);
  const week = buildDailySeries(data, getLocalDateKey(), 7);

  async function submitMeasurement(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const record = Object.fromEntries(new FormData(form).entries());
    if (
      !["weight", "waist", "hip", "chest", "arm"].some(
        (key) => number(record[key]) > 0,
      )
    ) {
      setFormError(t("progress.addOneMeasurement"));
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await onAddMeasurement(record);
      form.reset();
      form.elements.dateKey.value = getLocalDateKey();
    } catch (error) {
      setFormError(error?.message || t("progress.saveMeasurementFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack progress-page">
      <article className="panel radar-panel">
        <div className="section-heading radar-heading">
          <div>
            <span className="eyebrow">{t("progress.balance")}</span>
            <h2>{t("progress.compared")}</h2>
            <p className="muted">{t("progress.averageNote")}</p>
          </div>
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            label={t("progress.period")}
            options={[
              ["today", t("progress.today")],
              ["week", t("progress.week")],
              ["month", t("progress.month")],
            ]}
          />
        </div>
        <RadarChart axes={axes} />
        <div className="chart-explainer">
          <AppIcon name="spark" />
          <p>
            <strong>{t("progress.readTitle")}</strong>
            <br />
            {t("progress.readText")}
          </p>
        </div>
      </article>

      <div className="progress-stat-grid">
        <article className="progress-kpi">
          <span className="stat-icon green">
            <AppIcon name="check" />
          </span>
          <div>
            <small>{t("progress.balanceDays")}</small>
            <strong>
              {adherence.targetDays} <span>/ 7</span>
            </strong>
          </div>
        </article>
        <article className="progress-kpi">
          <span className="stat-icon orange">
            <AppIcon name="flame" />
          </span>
          <div>
            <small>{t("progress.calorieAverage")}</small>
            <strong>
              {Math.round(adherence.averageCalories)} <span>kcal</span>
            </strong>
          </div>
        </article>
        <article className="progress-kpi">
          <span className="stat-icon blue">
            <AppIcon name="target" />
          </span>
          <div>
            <small>{t("progress.proteinAverage")}</small>
            <strong>
              {Math.round(adherence.averageProtein)} <span>g</span>
            </strong>
          </div>
        </article>
        <article className="progress-kpi">
          <span className="stat-icon purple">
            <AppIcon name="scale" />
          </span>
          <div>
            <small>{t("progress.weightChange")}</small>
            <strong>
              {change == null
                ? "—"
                : `${change > 0 ? "+" : ""}${change.toFixed(1)}`}{" "}
              <span>kg</span>
            </strong>
          </div>
        </article>
      </div>

      <div className="content-grid progress-grid">
        <article className="panel trend-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("progress.bodyTrend")}</span>
              <h2>{t("progress.weightEvolution")}</h2>
            </div>
            {latest && (
              <span className="trend-current">
                <strong>{latest.weight} kg</strong>
                <small>{t("progress.latest")}</small>
              </span>
            )}
          </div>
          <LineChart
            points={measurements}
            emptyText={t("progress.needWeights")}
          />
        </article>
        <article className="panel adherence-panel">
          <span className="eyebrow">{t("home.lastSeven")}</span>
          <h2>{t("progress.dailyCalories")}</h2>
          <WeeklyBars series={week} goal={data.goals.calories} />
          <p className="muted">{t("progress.barGoal")}</p>
        </article>
      </div>

      <div className="content-grid measurement-grid">
        <article className="panel">
          <span className="eyebrow">{t("progress.bodyTracking")}</span>
          <h2>{t("progress.newMeasurement")}</h2>
          <p className="muted measurement-intro">
            {t("progress.consistencyTip")}
          </p>
          <form className="measurement-form" onSubmit={submitMeasurement}>
            <div className="form-grid three">
              <label>
                {t("log.date")}
                <input
                  type="date"
                  name="dateKey"
                  defaultValue={getLocalDateKey()}
                />
              </label>
              <label>
                {t("progress.weight")} (kg)
                <input
                  type="number"
                  min="1"
                  step="any"
                  name="weight"
                  placeholder="—"
                />
              </label>
              <label>
                {t("progress.waist")} (cm)
                <input
                  type="number"
                  min="1"
                  step="any"
                  name="waist"
                  placeholder="—"
                />
              </label>
              <label>
                {t("progress.hip")} (cm)
                <input
                  type="number"
                  min="1"
                  step="any"
                  name="hip"
                  placeholder="—"
                />
              </label>
              <label>
                {t("progress.chest")} (cm)
                <input
                  type="number"
                  min="1"
                  step="any"
                  name="chest"
                  placeholder="—"
                />
              </label>
              <label>
                {t("progress.arm")} (cm)
                <input
                  type="number"
                  min="1"
                  step="any"
                  name="arm"
                  placeholder="—"
                />
              </label>
            </div>
            <label className="textarea-label">
              {t("progress.notes")}
              <textarea
                name="notes"
                rows="3"
                placeholder={t("progress.notesPlaceholder")}
              />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? t("log.saving") : t("progress.saveMeasurement")}
            </button>
          </form>
        </article>
        <article className="panel measurement-history">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("progress.yourEntries")}</span>
              <h2>{t("progress.measurementHistory")}</h2>
            </div>
            <span className="count-badge">{measurements.length}</span>
          </div>
          {measurements.length ? (
            <div className="measurement-list">
              {[...measurements]
                .reverse()
                .slice(0, 8)
                .map((item) => (
                  <div className="measurement-row" key={item.id}>
                    <div className="measurement-date">
                      <strong>{formatDateLabel(item.dateKey, locale)}</strong>
                      <span>{item.notes || t("progress.noNotes")}</span>
                    </div>
                    <div className="measurement-values">
                      {item.weight && <b>{item.weight} kg</b>}
                      {item.waist && (
                        <span>
                          {t("progress.waist")} {item.waist} cm
                        </span>
                      )}
                    </div>
                    <button
                      className="icon-button delete-action"
                      onClick={() => onDeleteMeasurement(item)}
                      aria-label={t("progress.deleteMeasurement")}
                    >
                      <AppIcon name="trash" size={17} />
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              icon="scale"
              title={t("progress.emptyMeasurementTitle")}
            >
              {t("progress.emptyMeasurementText")}
            </EmptyState>
          )}
        </article>
      </div>
    </section>
  );
}
