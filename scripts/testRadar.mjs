import assert from "node:assert/strict";
import { RADAR_AXIS_KEYS, buildRadarAxes } from "../src/utils/radar.js";

assert.deepEqual(
  RADAR_AXIS_KEYS.map(([key]) => key),
  ["calories", "protein", "carbs", "fat", "fiber"],
);
assert.equal(RADAR_AXIS_KEYS.length, 5);
assert.equal(
  RADAR_AXIS_KEYS.some(([key]) => key === "water"),
  false,
);

const axes = buildRadarAxes(
  { calories: 1800, protein: 90, carbs: 200, fat: 60, fiber: 20, water: 1500 },
  { calories: 2000, protein: 100, carbs: 220, fat: 70, fiber: 25, water: 2000 },
  (key) => key,
  (value) => Number(value) || 0,
);
assert.deepEqual(
  axes.map((axis) => axis.key),
  ["calories", "protein", "carbs", "fat", "fiber"],
);
assert.equal(
  axes.some((axis) => axis.key === "water"),
  false,
);
assert.equal(
  axes.some((axis) => axis.label === "macro.water"),
  false,
);

console.log("Radar de nutrición validado con cinco ejes y sin agua.");
