import { getLocalDateKey, shiftDateKey } from "./dateUtils.js";
import { sumNutrition } from "./nutrition.js";

export function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function dateKeysEndingAt(endDate, days) {
  return Array.from({ length: days }, (_, index) =>
    shiftDateKey(endDate, index - days + 1),
  );
}

export function totalsForDate(foods, dateKey) {
  return sumNutrition(foods.filter((food) => food.dateKey === dateKey));
}

export function waterForDate(water, dateKey) {
  return water
    .filter((entry) => entry.dateKey === dateKey)
    .reduce((total, entry) => total + number(entry.amount), 0);
}

export function buildDailySeries(data, endDate, days) {
  return dateKeysEndingAt(endDate, days).map((dateKey) => ({
    dateKey,
    ...totalsForDate(data.foods || [], dateKey),
    water: waterForDate(data.water || [], dateKey),
    entries: (data.foods || []).filter((food) => food.dateKey === dateKey).length,
  }));
}

export function periodSummary(data, period = "today", endDate = getLocalDateKey()) {
  const days = period === "month" ? 30 : period === "week" ? 7 : 1;
  const series = buildDailySeries(data, endDate, days);
  const sum = series.reduce(
    (total, day) => {
      ["calories", "protein", "carbs", "fat", "fiber", "water"].forEach(
        (key) => {
          total[key] += number(day[key]);
        },
      );
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0 },
  );
  const average = Object.fromEntries(
    Object.entries(sum).map(([key, value]) => [key, value / days]),
  );
  return { days, series, sum, average: period === "today" ? sum : average };
}

export function adherenceStats(data, endDate = getLocalDateKey(), days = 7) {
  const series = buildDailySeries(data, endDate, days);
  const calorieGoal = number(data.goals?.calories);
  const proteinGoal = number(data.goals?.protein);
  const logged = series.filter((day) => day.entries > 0);
  const targetDays = logged.filter(
    (day) =>
      (!calorieGoal || (day.calories >= calorieGoal * 0.8 && day.calories <= calorieGoal * 1.1)) &&
      (!proteinGoal || day.protein >= proteinGoal * 0.8),
  ).length;
  return {
    loggedDays: logged.length,
    targetDays,
    averageCalories: logged.length
      ? logged.reduce((sum, day) => sum + day.calories, 0) / logged.length
      : 0,
    averageProtein: logged.length
      ? logged.reduce((sum, day) => sum + day.protein, 0) / logged.length
      : 0,
    averageWater: logged.length
      ? logged.reduce((sum, day) => sum + day.water, 0) / logged.length
      : 0,
  };
}

export function currentStreak(foods, today = getLocalDateKey()) {
  const logged = new Set((foods || []).map((food) => food.dateKey));
  let cursor = today;
  let streak = 0;
  while (logged.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export function sortedMeasurements(measurements) {
  return [...(measurements || [])].sort((a, b) =>
    String(a.dateKey).localeCompare(String(b.dateKey)),
  );
}

export function weightChange(measurements) {
  const withWeight = sortedMeasurements(measurements).filter(
    (item) => number(item.weight) > 0,
  );
  if (withWeight.length < 2) return null;
  return number(withWeight.at(-1).weight) - number(withWeight[0].weight);
}
