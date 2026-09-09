import assert from "node:assert/strict";
import {
  adherenceStats,
  buildDailySeries,
  currentStreak,
  periodSummary,
  weightChange,
} from "../src/utils/analytics.js";
import { createId } from "../src/utils/id.js";

const data = {
  goals: { calories: 2000, protein: 100, carbs: 220, fat: 70, fiber: 25, water: 2000 },
  foods: [
    { dateKey: "2026-09-01", calories: 1800, protein: 90, carbs: 200, fat: 60, nutrients: { fiber: 20 } },
    { dateKey: "2026-09-02", calories: 2000, protein: 100, carbs: 220, fat: 70, nutrients: { fiber: 25 } },
  ],
  water: [
    { dateKey: "2026-09-01", amount: 1500 },
    { dateKey: "2026-09-02", amount: 2000 },
  ],
  measurements: [
    { dateKey: "2026-08-01", weight: 80 },
    { dateKey: "2026-09-01", weight: 78.5 },
  ],
};

const series = buildDailySeries(data, "2026-09-02", 2);
assert.equal(series.length, 2);
assert.equal(series[0].fiber, 20);
assert.equal(series[1].water, 2000);

const week = periodSummary(data, "week", "2026-09-02");
assert.equal(week.days, 7);
assert.equal(Math.round(week.sum.calories), 3800);

const adherence = adherenceStats(data, "2026-09-02", 2);
assert.equal(adherence.loggedDays, 2);
assert.equal(adherence.targetDays, 2);
assert.equal(currentStreak(data.foods, "2026-09-02"), 2);
assert.equal(weightChange(data.measurements), -1.5);

const ids = new Set(Array.from({ length: 20 }, createId));
assert.equal(ids.size, 20);
assert.match([...ids][0], /^[0-9a-f-]{36}$/);

console.log("Analíticas, rachas, mediciones e IDs validados.");
