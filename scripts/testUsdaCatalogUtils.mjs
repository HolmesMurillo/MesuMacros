import assert from "node:assert/strict";
import {
  extractNutrients,
  hasCompleteMacros,
  summarizeCandidate,
} from "./usdaCatalogUtils.mjs";

const detailedResponse = [
  { nutrient: { id: 1008 }, amount: 165 },
  { nutrient: { id: 1003 }, amount: 31 },
  { nutrient: { id: 1005 }, amount: 0 },
  { nutrient: { id: 1004 }, amount: 3.6 },
];
const searchResponse = [
  { nutrientId: 1008, value: 130 },
  { nutrientId: 1003, value: 2.7 },
  { nutrientId: 1005, value: 28.2 },
  { nutrientId: 1004, value: 0.3 },
];

assert.deepEqual(
  Object.fromEntries(
    Object.entries(extractNutrients(detailedResponse)).filter(([key]) =>
      ["calories", "protein", "carbs", "fat"].includes(key),
    ),
  ),
  { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
);
assert.equal(hasCompleteMacros(extractNutrients(detailedResponse)), true);
assert.equal(hasCompleteMacros(extractNutrients(searchResponse)), true);
assert.equal(hasCompleteMacros(extractNutrients([])), false);

const candidate = summarizeCandidate("Cooked white rice", {
  fdcId: 123,
  description: "Rice, white, long-grain, regular, cooked",
  dataType: "SR Legacy",
  foodNutrients: searchResponse,
});
assert.equal(candidate.fdcId, 123);
assert.equal(candidate.completeMacros, true);
assert.equal(candidate.nutrients.carbs, 28.2);

console.log("Utilidades USDA válidas para respuestas resumidas y detalladas.");
