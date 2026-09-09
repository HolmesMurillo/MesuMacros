export const macroKeys = ["calories", "protein", "carbs", "fat"];

export const nutrientIds = {
  calories: [1008, 2047, 2048],
  protein: [1003],
  carbs: [1005],
  fat: [1004],
  fiber: [1079],
  sugars: [2000],
  addedSugars: [1235],
  saturatedFat: [1258],
  transFat: [1257],
  cholesterol: [1253],
  sodium: [1093],
  potassium: [1092],
  calcium: [1087],
  iron: [1089],
  magnesium: [1090],
  zinc: [1095],
  phosphorus: [1091],
  vitaminA: [1106],
  vitaminC: [1162],
  vitaminD: [1114],
  vitaminE: [1109],
  vitaminK: [1185],
  vitaminB1: [1165],
  vitaminB2: [1166],
  vitaminB3: [1167],
  vitaminB6: [1175],
  folate: [1177],
  vitaminB12: [1178],
  selenium: [1103],
  copper: [1098],
  manganese: [1101],
};

const ignoredWords = new Set([
  "and",
  "or",
  "with",
  "without",
  "the",
  "a",
  "an",
  "of",
]);

function clean(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value) {
  return clean(value)
    .split(/\s+/)
    .filter((token) => token && !ignoredWords.has(token));
}

function nutrientIdentifier(item) {
  const value = item?.nutrientId ?? item?.nutrient?.id;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nutrientAmount(item) {
  const value = item?.amount ?? item?.value;
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function amountForNutrient(items, acceptedIds) {
  for (const acceptedId of acceptedIds) {
    const match = (items || []).find(
      (item) => nutrientIdentifier(item) === acceptedId,
    );
    const amount = nutrientAmount(match);
    if (amount !== null) return amount;
  }
  return null;
}

export function extractNutrients(items) {
  return Object.fromEntries(
    Object.entries(nutrientIds).map(([key, ids]) => [
      key,
      amountForNutrient(items, ids),
    ]),
  );
}

export function hasCompleteMacros(nutrients) {
  return macroKeys.every((key) => Number.isFinite(nutrients?.[key]));
}

export function scoreCandidate(query, candidate) {
  const queryTokens = tokens(query);
  const description = clean(candidate?.description);
  const matches = queryTokens.filter((token) => description.includes(token));
  const coverage = queryTokens.length ? matches.length / queryTokens.length : 0;
  const typeBonus =
    candidate?.dataType === "Foundation"
      ? 0.12
      : candidate?.dataType === "SR Legacy"
        ? 0.08
        : 0.04;
  return Number((coverage + typeBonus).toFixed(3));
}

export function summarizeCandidate(query, candidate) {
  const nutrients = extractNutrients(candidate?.foodNutrients || []);
  return {
    fdcId: candidate?.fdcId ?? null,
    description: candidate?.description || "",
    dataType: candidate?.dataType || "",
    score: scoreCandidate(query, candidate),
    completeMacros: hasCompleteMacros(nutrients),
    nutrients,
  };
}

export function buildCatalogModule(foods, metadata) {
  const categories = [...new Set(foods.map((food) => food.category))];
  return [
    `export const commonFoods = ${JSON.stringify(foods, null, 2)};`,
    `export const catalogCategories = ${JSON.stringify(categories, null, 2)};`,
    `export const catalogMetadata = ${JSON.stringify(metadata, null, 2)};`,
    "",
  ].join("\n");
}
