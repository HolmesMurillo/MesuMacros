export const RADAR_AXIS_KEYS = [
  ["calories", "macro.calories", "kcal"],
  ["protein", "macro.protein", "g"],
  ["carbs", "macro.carbs", "g"],
  ["fat", "macro.fat", "g"],
  ["fiber", "macro.fiber", "g"],
];

export function buildRadarAxes(summary, goals, translate, number) {
  return RADAR_AXIS_KEYS.map(([key, label, unit]) => ({
    key,
    label: translate(label),
    unit,
    value: number(summary[key]),
    goal: number(goals[key]),
  }));
}
