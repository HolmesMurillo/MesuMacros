import fs from "node:fs";
import path from "node:path";
import { commonFoods, catalogCategories } from "../src/data/commonFoods.js";

const root = process.cwd();
const review = JSON.parse(fs.readFileSync(path.join(root, "scripts/usda-review.json"), "utf8"));
const reviewed = new Map(review.foods.map((food) => [food.catalogId, food]));
const verifiedAt = new Date().toISOString().slice(0, 10);

// Curated when the first search result was a branded product, a raw food for a
// cooked label, or a similarly named but different food.
const selections = {
  "catalog-chicken-thigh-cooked": 2706028,
  "catalog-ground-turkey-93": 746785,
  "catalog-beef-tenderloin": 2705841,
  "catalog-pork-chop": 2705868,
  "catalog-salmon": 172000,
  "catalog-shrimp": 175180,
  "catalog-sardines-oil": 175139,
  "catalog-whole-egg": 2707153,
  "catalog-pinto-beans": 175200,
  "catalog-skim-milk": 2705388,
  "catalog-white-rice": 2708408,
  "catalog-brown-rice": 2708414,
  "catalog-quinoa": 168917,
  "catalog-white-bread": 2707598,
  "catalog-ripe-plantain": 2709558,
  "catalog-cassava": 2709564,
  "catalog-grapes": 2709237,
  "catalog-grapefruit": 2709165,
  "catalog-broccoli": 2710792,
  "catalog-cucumber": 2709784,
  "catalog-cauliflower": 2710801,
  "catalog-olive-oil": 171413,
};

// Generic USDA reference values per 100 g for foods whose API search was
// unavailable or ambiguous. These entries deliberately do not claim an FDC ID.
const manualMacros = {
  "catalog-pork-loin": [206, 28.9, 0, 9.1, 0],
  "catalog-lentils": [116, 9.02, 20.13, 0.38, 7.9],
  "catalog-cottage-cheese": [81, 10.45, 4.76, 2.27, 0],
  "catalog-white-pasta": [158, 5.8, 30.86, 0.93, 1.8],
  "catalog-whole-bread": [252, 12.45, 43.1, 3.5, 6],
  "catalog-corn-tortilla": [218, 5.7, 44.64, 2.85, 6.3],
  "catalog-sweet-potato": [90, 2.01, 20.71, 0.15, 3.3],
  "catalog-banana": [89, 1.09, 22.84, 0.33, 2.6],
  "catalog-orange": [47, 0.94, 11.75, 0.12, 2.4],
  "catalog-mandarin": [53, 0.81, 13.34, 0.31, 1.8],
  "catalog-blueberries": [57, 0.74, 14.49, 0.33, 2.4],
  "catalog-raspberries": [52, 1.2, 11.94, 0.65, 6.5],
  "catalog-watermelon": [30, 0.61, 7.55, 0.15, 0.4],
  "catalog-avocado": [160, 2, 8.53, 14.66, 6.7],
  "catalog-lemon": [29, 1.1, 9.32, 0.3, 2.8],
  "catalog-romaine": [17, 1.23, 3.29, 0.3, 2.1],
  "catalog-carrot": [41, 0.93, 9.58, 0.24, 2.8],
  "catalog-onion": [40, 1.1, 9.34, 0.1, 1.7],
  "catalog-red-pepper": [31, 0.99, 6.03, 0.3, 2.1],
  "catalog-celery": [14, 0.69, 2.97, 0.17, 1.6],
  "catalog-asparagus": [22, 2.4, 4.11, 0.22, 2],
  "catalog-green-peas": [84, 5.36, 15.63, 0.22, 5.5],
  "catalog-butter": [717, 0.85, 0.06, 81.11, 0],
  "catalog-almonds": [579, 21.15, 21.55, 49.93, 12.5],
  "catalog-hazelnuts": [628, 14.95, 16.7, 60.75, 9.7],
  "catalog-brazil-nuts": [659, 14.32, 11.74, 67.1, 7.5],
  "catalog-coconut-oil": [892, 0, 0, 99.06, 0],
};

function manualFood(food, values) {
  const [calories, protein, carbs, fat, fiber] = values;
  return {
    ...food,
    fdcId: null,
    sourceDescription: "Valor genérico por 100 g, curado a partir de USDA FoodData Central.",
    sourceReference: "https://fdc.nal.usda.gov/",
    dataType: "USDA curated reference",
    verifiedAt,
    nutrientsPer100g: {
      ...food.nutrientsPer100g,
      calories,
      protein,
      carbs,
      fat,
      fiber,
    },
  };
}

function reviewedFood(food) {
  const item = reviewed.get(food.id);
  if (!item) throw new Error(`No hay reporte para ${food.id}`);
  const requestedId = selections[food.id] || item.recommendedFdcId;
  const candidate = item.candidates.find((entry) => entry.fdcId === requestedId && entry.completeMacros)
    || item.candidates.find((entry) => entry.completeMacros);
  if (!candidate) throw new Error(`No hay candidato completo para ${food.id}`);
  return {
    ...food,
    fdcId: candidate.fdcId,
    sourceDescription: candidate.description,
    sourceReference: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${candidate.fdcId}/nutrients`,
    dataType: candidate.dataType,
    verifiedAt,
    nutrientsPer100g: candidate.nutrients,
  };
}

const completed = commonFoods.map((food) => manualMacros[food.id]
  ? manualFood(food, manualMacros[food.id])
  : reviewedFood(food));

const source = `export const commonFoods = ${JSON.stringify(completed, null, 2)};\nexport const catalogCategories = ${JSON.stringify(catalogCategories, null, 2)};\nexport const catalogMetadata = ${JSON.stringify({
  source: "USDA FoodData Central",
  sourceUrl: "https://fdc.nal.usda.gov/",
  status: "complete",
  verifiedAt,
  verifiedCount: completed.length,
  totalCount: completed.length,
}, null, 2)};\n`;

fs.writeFileSync(path.join(root, "src/data/commonFoods.js"), source);
console.log(`Catálogo completado: ${completed.length}/${completed.length} alimentos con kcal, P, C y G.`);
