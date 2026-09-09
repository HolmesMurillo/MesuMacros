import { commonFoods, catalogMetadata } from "../src/data/commonFoods.js";

const errors = [];
const expectedCounts = {
  proteins: 30,
  grains: 20,
  fruits: 20,
  vegetables: 20,
  fats: 20,
};
if (commonFoods.length !== 110)
  errors.push(`Se esperaban 110 alimentos y hay ${commonFoods.length}`);
const ids = new Set();
const fdcIds = new Set();
const enabledFoods = [];
const categoryCounts = new Map(
  Object.entries(expectedCounts).map(([key]) => [key, 0]),
);
for (const food of commonFoods) {
  if (ids.has(food.id)) errors.push(`ID duplicado: ${food.id}`);
  ids.add(food.id);

  if (!food.name?.es || !food.name?.en)
    errors.push(`Nombre incompleto: ${food.id}`);
  if (!food.category) errors.push(`Categoría ausente: ${food.id}`);
  else
    categoryCounts.set(
      food.category,
      (categoryCounts.get(food.category) || 0) + 1,
    );
  if (!food.source || !food.sourceDescription || !food.servings?.length)
    errors.push(`Fuente ausente: ${food.id}`);

  if (food.dataType !== "pending_verification") {
    enabledFoods.push(food);
    if (!food.fdcId && food.dataType !== "USDA curated reference")
      errors.push(`fdcId ausente: ${food.id}`);
    if (
      food.dataType === "USDA curated reference" &&
      !food.sourceReference
    )
      errors.push(`Referencia USDA ausente: ${food.id}`);
    if (!food.verifiedAt)
      errors.push(`Fecha de verificación ausente: ${food.id}`);
    if (food.fdcId && fdcIds.has(food.fdcId))
      errors.push(`fdcId duplicado: ${food.fdcId}`);
    if (food.fdcId) fdcIds.add(food.fdcId);
    for (const key of ["calories", "protein", "carbs", "fat"])
      if (typeof food.nutrientsPer100g[key] !== "number")
        errors.push(`Macro ausente: ${food.id}/${key}`);
  }

  for (const serving of food.servings || []) {
    if (serving.grams == null || serving.grams <= 0)
      errors.push(`Porción inválida: ${food.id}`);
    if (
      serving.unit &&
      !/^(g|oz|ml|cup|tbsp|portion|unit)$/i.test(serving.unit)
    )
      errors.push(`Unidad no normalizada: ${food.id}/${serving.unit}`);
  }

  for (const [key, value] of Object.entries(food.nutrientsPer100g || {})) {
    if (value === 0) continue;
    if (value !== null && (typeof value !== "number" || value < 0))
      errors.push(`Valor inválido: ${food.id}/${key} = ${value}`);
  }
}

for (const [category, expected] of Object.entries(expectedCounts)) {
  const count = categoryCounts.get(category) || 0;
  if (count !== expected) {
    errors.push(
      `Se esperaban ${expected} alimentos en ${category} y hay ${count}.`,
    );
  }
}

if (["verified", "complete"].includes(catalogMetadata?.status)) {
  const verified = commonFoods.filter(
    (food) => food.dataType !== "pending_verification",
  );
  if (verified.length !== 110) {
    errors.push(
      `El catálogo completo no puede quedar incompleto: ${verified.length}/110 alimentos listos.`,
    );
  }
}

if (catalogMetadata?.status === "partial" && !enabledFoods.length)
  errors.push(
    "El catálogo figura como parcial, pero no tiene alimentos verificados.",
  );
if (
  Number.isInteger(catalogMetadata?.verifiedCount) &&
  catalogMetadata.verifiedCount !== enabledFoods.length
)
  errors.push(
    `El metadata indica ${catalogMetadata.verifiedCount} verificados, pero hay ${enabledFoods.length}.`,
  );

for (const food of enabledFoods) {
  const macros = ["calories", "protein", "carbs", "fat"];
  for (const key of macros)
    if (food.nutrientsPer100g[key] == null)
      errors.push(`Macro nula en alimento habilitado: ${food.id}/${key}`);
  const grams = 50;
  const expected = (food.nutrientsPer100g.calories * grams) / 100;
  if (!Number.isFinite(expected) || expected < 0)
    errors.push(`Cálculo por gramos inválido: ${food.id}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Catálogo válido: ${commonFoods.length} alimentos, ${ids.size} IDs únicos, ${enabledFoods.length} habilitados.`,
);
