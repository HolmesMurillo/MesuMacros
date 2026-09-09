const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const spanishAliases: Record<string, string> = {
  "cafe": "coffee",
  "café": "coffee",
  "cafe negro": "black coffee brewed",
  "café negro": "black coffee brewed",
  "te": "tea",
  "té": "tea",
  "te verde": "green tea brewed",
  "té verde": "green tea brewed",
  "te negro": "black tea brewed",
  "té negro": "black tea brewed",
  "huevo": "egg",
  "pollo": "chicken",
  "arroz": "rice",
  "leche": "milk",
  "avena": "oats",
  "pan": "bread",
  "queso": "cheese",
  "manzana": "apple",
  "banana": "banana",
  "cambur": "banana",
  "carne": "beef",
  "pescado": "fish",
};

type FoodNutrient = {
  nutrientId?: number;
  nutrientName?: string;
  unitName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: FoodNutrient[];
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function nutrient(food: UsdaFood, id: number, names: string[]) {
  const nutrients = food.foodNutrients || [];
  const found = nutrients.find((item) => item.nutrientId === id) || nutrients.find((item) =>
    names.includes(String(item.nutrientName || "").toLowerCase()),
  );
  const value = Number(found?.value);
  return found?.value !== null && found?.value !== undefined && Number.isFinite(value) ? value : null;
}

function normalize(food: UsdaFood) {
  const calories = nutrient(food, 1008, ["energy"]);
  const protein = nutrient(food, 1003, ["protein"]);
  const fat = nutrient(food, 1004, ["total lipid (fat)", "total fat"]);
  const carbs = nutrient(food, 1005, ["carbohydrate, by difference", "carbohydrate"]);
  if ([calories, protein, carbs, fat].some((value) => value === null)) return null;
  const servingSize = Number(food.servingSize);
  const servingUnit = String(food.servingSizeUnit || "").toLowerCase();
  return {
    id: `usda-${food.fdcId}`,
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandName || food.brandOwner || "",
    dataType: food.dataType || "USDA",
    source: "USDA FoodData Central",
    calories,
    protein,
    carbs,
    fat,
    nutrients: {
      fiber: nutrient(food, 1079, ["fiber, total dietary"]),
      sugars: nutrient(food, 2000, ["sugars, total including nlea", "sugars, total"]),
      saturatedFat: nutrient(food, 1258, ["fatty acids, total saturated"]),
      sodium: nutrient(food, 1093, ["sodium, na"]),
      potassium: nutrient(food, 1092, ["potassium, k"]),
      calcium: nutrient(food, 1087, ["calcium, ca"]),
      iron: nutrient(food, 1089, ["iron, fe"]),
      vitaminC: nutrient(food, 1162, ["vitamin c, total ascorbic acid"]),
    },
    serving: Number.isFinite(servingSize) && servingSize > 0 && ["g", "gram", "grams"].includes(servingUnit)
      ? { grams: servingSize, label: food.householdServingFullText || `${servingSize} g` }
      : null,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ code: "METHOD_NOT_ALLOWED" }, 405);
  if (!request.headers.get("Authorization")?.startsWith("Bearer ")) {
    return json({ code: "UNAUTHORIZED" }, 401);
  }

  const apiKey = Deno.env.get("USDA_API_KEY");
  if (!apiKey) return json({ code: "USDA_NOT_CONFIGURED" }, 503);

  let input: { query?: string; pageSize?: number };
  try { input = await request.json(); }
  catch { return json({ code: "INVALID_REQUEST" }, 400); }

  const rawQuery = String(input.query || "").trim().slice(0, 80);
  if (rawQuery.length < 2) return json({ code: "QUERY_TOO_SHORT" }, 400);
  const query = spanishAliases[rawQuery.toLowerCase()] || rawQuery;
  const pageSize = Math.min(30, Math.max(5, Number(input.pageSize) || 20));
  const endpoint = "https://api.nal.usda.gov/fdc/v1/foods/search";
  const baseBody = { query, pageSize, pageNumber: 1, sortBy: "dataType.keyword", sortOrder: "asc" };

  try {
    let response = await fetch(`${endpoint}?api_key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...baseBody, dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"] }),
    });
    if (response.status === 400) {
      response = await fetch(`${endpoint}?api_key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baseBody),
      });
    }
    if (response.status === 429) return json({ code: "USDA_RATE_LIMIT" }, 429);
    if (!response.ok) return json({ code: "USDA_SEARCH_FAILED" }, 502);
    const payload = await response.json();
    const foods = (Array.isArray(payload.foods) ? payload.foods : [])
      .map(normalize)
      .filter(Boolean)
      .slice(0, 24);
    return json({ foods, totalHits: Number(payload.totalHits) || foods.length });
  } catch {
    return json({ code: "USDA_NETWORK_ERROR" }, 502);
  }
});
