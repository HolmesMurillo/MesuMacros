import { formatShortDate } from "../utils/dateUtils";
import { useLanguage } from "../context/languageContext";

function polarPoint(cx, cy, radius, index, count) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function pointsFor(values, radius, cx, cy) {
  return values
    .map((value, index) => {
      const [x, y] = polarPoint(cx, cy, radius * value, index, values.length);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function RadarChart({ axes }) {
  const { t } = useLanguage();
  const cx = 260;
  const cy = 215;
  const radius = 128;
  const ratios = axes.map((axis) =>
    Math.min(1.2, axis.goal ? axis.value / axis.goal : 0),
  );
  const labelRadius = 178;
  return (
    <div className="radar-wrap">
      <svg className="radar-chart" viewBox="0 0 520 430" role="img" aria-label={t("charts.radarAria")}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
          <polygon
            key={level}
            points={pointsFor(Array(axes.length).fill(level), radius, cx, cy)}
            className={level === 1 ? "radar-grid radar-goal" : "radar-grid"}
          />
        ))}
        {axes.map((axis, index) => {
          const [x, y] = polarPoint(cx, cy, radius, index, axes.length);
          return <line key={axis.key} x1={cx} y1={cy} x2={x} y2={y} className="radar-axis" />;
        })}
        <polygon points={pointsFor(ratios, radius, cx, cy)} className="radar-data" />
        {ratios.map((ratio, index) => {
          const [x, y] = polarPoint(cx, cy, radius * ratio, index, axes.length);
          return <circle key={axes[index].key} cx={x} cy={y} r="4.5" className="radar-point" />;
        })}
        {axes.map((axis, index) => {
          const [x, y] = polarPoint(cx, cy, labelRadius, index, axes.length);
          const percent = axis.goal ? Math.round((axis.value / axis.goal) * 100) : 0;
          const anchor = x < cx - 16 ? "end" : x > cx + 16 ? "start" : "middle";
          return (
            <g key={axis.key} className="radar-label">
              <text x={x} y={y - 4} textAnchor={anchor}>{axis.label}</text>
              <text x={x} y={y + 14} textAnchor={anchor} className="radar-value">
                {Math.round(axis.value)} / {axis.goal} {axis.unit} · {percent}%
              </text>
            </g>
          );
        })}
      </svg>
      <div className="chart-legend"><span><i className="legend-solid" />{t("charts.consumed")}</span><span><i className="legend-dashed" />{t("charts.dailyGoal")}</span></div>
    </div>
  );
}

export function LineChart({ points, valueKey = "weight", unit = "kg", emptyText }) {
  const { locale, t } = useLanguage();
  const clean = points.filter((point) => Number(point[valueKey]) > 0);
  if (clean.length < 2) return <div className="chart-empty">{emptyText}</div>;
  const width = 620;
  const height = 230;
  const pad = { left: 42, right: 18, top: 20, bottom: 36 };
  const values = clean.map((point) => Number(point[valueKey]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const coords = clean.map((point, index) => ({
    ...point,
    x: pad.left + (index / (clean.length - 1)) * (width - pad.left - pad.right),
    y: pad.top + ((max - Number(point[valueKey])) / spread) * (height - pad.top - pad.bottom),
  }));
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${pad.left},${height - pad.bottom} ${polyline} ${width - pad.right},${height - pad.bottom}`;
  return (
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t("charts.trend", { unit })}>
      {[0, 0.5, 1].map((level) => {
        const y = pad.top + level * (height - pad.top - pad.bottom);
        const label = max - level * spread;
        return <g key={level}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="chart-grid"/><text x={pad.left - 8} y={y + 4} textAnchor="end" className="chart-tick">{label.toFixed(1)}</text></g>;
      })}
      <polygon points={area} className="line-area" />
      <polyline points={polyline} className="line-path" />
      {coords.map((point, index) => (
        <g key={`${point.dateKey}-${index}`}>
          <circle cx={point.x} cy={point.y} r="4" className="line-dot"><title>{point[valueKey]} {unit}</title></circle>
          {(index === 0 || index === coords.length - 1) && <text x={point.x} y={height - 12} textAnchor={index === 0 ? "start" : "end"} className="chart-tick">{formatShortDate(point.dateKey, {}, locale)}</text>}
        </g>
      ))}
    </svg>
  );
}

export function WeeklyBars({ series, goal }) {
  const { locale, t } = useLanguage();
  const max = Math.max(goal || 0, ...series.map((day) => day.calories), 1);
  return (
    <div className="weekly-bars" aria-label={t("charts.sevenDays")}>
      {series.map((day) => {
        const percent = Math.min(100, (day.calories / max) * 100);
        const goalPercent = Math.min(100, ((goal || 0) / max) * 100);
        return (
          <div className="bar-day" key={day.dateKey} title={`${Math.round(day.calories)} kcal`}>
            <div className="bar-track">
              <span className="bar-goal" style={{ bottom: `${goalPercent}%` }} />
              <span className="bar-value" style={{ height: `${percent}%` }} />
            </div>
            <strong>{Math.round(day.calories)}</strong>
            <small>{formatShortDate(day.dateKey, { weekday: "short" }, locale)}</small>
          </div>
        );
      })}
    </div>
  );
}
