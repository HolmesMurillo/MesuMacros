import { supabase } from "./supabaseClient";
import { loadData } from "./storage";

const tables = [
  "food_entries",
  "water_entries",
  "body_measurements",
  "custom_foods",
  "favorite_foods",
];

export async function loadUserData(userId) {
  const [profile, goals, ...collections] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("nutrition_goals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    ...tables.map((table) =>
      supabase.from(table).select("*").eq("user_id", userId),
    ),
  ]);
  const failed = [profile, goals, ...collections].find(
    (result) => result.error,
  );
  if (failed) throw failed.error;
  const [foodEntries, waterEntries, measurements] = collections;
  const local = loadData(userId);
  return {
    ...local,
    profile: { ...local.profile, ...mapProfile(profile.data) },
    goals: { ...local.goals, ...mapGoals(goals.data) },
    foods: foodEntries.data.map(mapFood),
    water: waterEntries.data.map(mapWater),
    measurements: measurements.data.map(mapMeasurement),
  };
}

function mapProfile(value) {
  if (!value) return {};
  return {
    name: value.name || "",
    age: value.age || "",
    sex: value.sex || "",
    height: value.height || "",
    currentWeight: value.current_weight || "",
    targetWeight: value.target_weight || "",
    activity: value.activity || "moderate",
    goal: value.goal || "maintain",
    pace: value.pace || "0.25",
    units: value.units || "metric",
    language: value.language || "en",
    theme: value.theme || "light",
  };
}
function mapGoals(value) {
  if (!value) return {};
  return {
    calories: value.calories,
    protein: value.protein,
    carbs: value.carbs,
    fat: value.fat,
    fiber: value.fiber,
    water: value.water,
    micronutrients: value.micronutrients || {},
  };
}
function mapFood(value) {
  return {
    ...value,
    mealType: value.meal_type,
    dateKey: value.date_key,
    timeZone: value.time_zone,
    isFavorite: value.is_favorite,
  };
}

function mapWater(value) {
  return {
    ...value,
    dateKey: value.date_key,
    timeZone: value.time_zone,
  };
}

function mapMeasurement(value) {
  return {
    ...value,
    dateKey: value.date_key,
    timeZone: value.time_zone,
  };
}
function rowForFood(food, userId) {
  return {
    user_id: userId,
    name: food.name,
    brand: food.brand || null,
    amount: numberOrNull(food.amount),
    unit: food.unit,
    meal_type: food.mealType,
    date_key: food.dateKey,
    time: food.time || null,
    time_zone: food.timeZone || "UTC",
    calories: numberOrNull(food.calories),
    protein: numberOrNull(food.protein),
    carbs: numberOrNull(food.carbs),
    fat: numberOrNull(food.fat),
    nutrients: food.nutrients || {},
    is_favorite: Boolean(food.isFavorite ?? food.is_favorite),
    source: food.source || "manual",
    legacy_id: food.legacy_id || food.id,
    created_at: food.createdAt || food.created_at || new Date().toISOString(),
    updated_at: food.updatedAt || food.updated_at || new Date().toISOString(),
  };
}

function numberOrNull(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0)
    throw new Error("Nutriente inválido");
  return number;
}

function dateOrToday(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || ""))
    throw new Error("Fecha inválida");
  return value;
}

export async function insertFoodEntry(food) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
  const nutrients = Object.fromEntries(
    Object.entries(food.nutrients || {}).map(([key, value]) => [
      key,
      numberOrNull(value),
    ]),
  );
  const payload = {
    user_id: user.id,
    legacy_id: food.id || null,
    name: food.name.trim(),
    brand: food.brand?.trim() || null,
    amount: numberOrNull(food.amount),
    unit: food.unit,
    meal_type: food.mealType,
    date_key: dateOrToday(food.dateKey),
    time: food.time || null,
    time_zone:
      food.timeZone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC",
    calories: numberOrNull(food.calories),
    protein: numberOrNull(food.protein),
    carbs: numberOrNull(food.carbs),
    fat: numberOrNull(food.fat),
    nutrients,
    is_favorite: Boolean(food.isFavorite),
    source: food.source || "manual",
  };
  const { data, error } = await supabase
    .from("food_entries")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return mapFood(data);
}

function looksLikeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || "",
  );
}

export async function saveFoodEntry(food) {
  if (!looksLikeUuid(food.id) || !food.user_id) return insertFoodEntry(food);
  const nutrients = Object.fromEntries(
    Object.entries(food.nutrients || {}).map(([key, value]) => [
      key,
      numberOrNull(value),
    ]),
  );
  const payload = {
    name: food.name.trim(),
    brand: food.brand?.trim() || null,
    amount: numberOrNull(food.amount),
    unit: food.unit,
    meal_type: food.mealType,
    date_key: dateOrToday(food.dateKey),
    time: food.time || null,
    time_zone: food.timeZone || "UTC",
    calories: numberOrNull(food.calories),
    protein: numberOrNull(food.protein),
    carbs: numberOrNull(food.carbs),
    fat: numberOrNull(food.fat),
    nutrients,
    is_favorite: Boolean(food.isFavorite),
    source: food.source || "manual",
  };
  const { data, error } = await supabase
    .from("food_entries")
    .update(payload)
    .eq("id", food.id)
    .select()
    .single();
  if (error) throw error;
  return mapFood(data);
}

export async function deleteFoodEntry(food) {
  let query = supabase.from("food_entries").delete();
  query = looksLikeUuid(food.id)
    ? query.eq("id", food.id)
    : query.eq("legacy_id", food.legacy_id || food.id);
  const { error } = await query;
  if (error) throw error;
}

export async function insertWaterEntry(entry) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
  const { data, error } = await supabase
    .from("water_entries")
    .insert({
      user_id: user.id,
      legacy_id: entry.id,
      date_key: dateOrToday(entry.dateKey),
      amount: numberOrNull(entry.amount),
      time_zone: entry.timeZone || "UTC",
      created_at: entry.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapWater(data);
}

export async function deleteWaterEntry(entry) {
  let query = supabase.from("water_entries").delete();
  query = looksLikeUuid(entry.id)
    ? query.eq("id", entry.id)
    : query.eq("legacy_id", entry.legacy_id || entry.id);
  const { error } = await query;
  if (error) throw error;
}

export async function insertMeasurementEntry(entry) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
  const { data, error } = await supabase
    .from("body_measurements")
    .insert({
      user_id: user.id,
      legacy_id: entry.id,
      date_key: dateOrToday(entry.dateKey),
      weight: numberOrNull(entry.weight),
      waist: numberOrNull(entry.waist),
      hip: numberOrNull(entry.hip),
      chest: numberOrNull(entry.chest),
      arm: numberOrNull(entry.arm),
      notes: entry.notes?.trim() || null,
      time_zone: entry.timeZone || "UTC",
      created_at: entry.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMeasurement(data);
}

export async function deleteMeasurementEntry(entry) {
  let query = supabase.from("body_measurements").delete();
  query = looksLikeUuid(entry.id)
    ? query.eq("id", entry.id)
    : query.eq("legacy_id", entry.legacy_id || entry.id);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteAllTrackingData() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
  const results = [];
  for (const table of [
    "favorite_foods",
    "custom_foods",
    "body_measurements",
    "water_entries",
    "food_entries",
  ]) {
    results.push(await supabase.from(table).delete().eq("user_id", user.id));
  }
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
}

export async function syncUserData(userId, data) {
  const profile = {
    user_id: userId,
    name: data.profile.name || null,
    age: data.profile.age || null,
    sex: data.profile.sex || null,
    height: data.profile.height || null,
    current_weight: data.profile.currentWeight || null,
    target_weight: data.profile.targetWeight || null,
    activity: data.profile.activity,
    goal: data.profile.goal,
    pace: data.profile.pace,
    units: data.profile.units,
    language: data.profile.language,
    theme: data.profile.theme,
  };
  const goals = {
    user_id: userId,
    calories: data.goals.calories,
    protein: data.goals.protein,
    carbs: data.goals.carbs,
    fat: data.goals.fat,
    fiber: data.goals.fiber,
    water: data.goals.water,
    micronutrients: data.goals.micronutrients || {},
  };
  const results = [
    await supabase.from("profiles").upsert(profile),
    await supabase
      .from("nutrition_goals")
      .upsert(goals, { onConflict: "user_id" }),
  ];
  results.push(
    ...(await Promise.all(
      data.foods.map((food) =>
        supabase.from("food_entries").upsert(rowForFood(food, userId), {
          onConflict: "user_id,legacy_id",
        }),
      ),
    )),
  );
  results.push(
    ...(await Promise.all(
      (data.water || []).map((item) =>
        supabase.from("water_entries").upsert(
          {
            user_id: userId,
            legacy_id: item.id,
            date_key: item.dateKey,
            amount: item.amount,
            time_zone: item.timeZone || "UTC",
            created_at: item.createdAt,
          },
          { onConflict: "user_id,legacy_id" },
        ),
      ),
    )),
  );
  results.push(
    ...(await Promise.all(
      (data.measurements || []).map((item) =>
        supabase.from("body_measurements").upsert(
          {
            user_id: userId,
            legacy_id: item.id,
            date_key: item.dateKey,
            weight: item.weight || null,
            waist: item.waist || null,
            hip: item.hip || null,
            chest: item.chest || null,
            arm: item.arm || null,
            notes: item.notes || null,
            time_zone: item.timeZone || "UTC",
            created_at: item.createdAt,
          },
          { onConflict: "user_id,legacy_id" },
        ),
      ),
    )),
  );
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
}

export async function migrateLegacyData(userId) {
  const legacy = loadData();
  const hasData =
    legacy.foods.length ||
    legacy.water.length ||
    legacy.measurements.length ||
    legacy.profile.name;
  if (!hasData) return { migrated: false, data: legacy };
  await syncUserData(userId, legacy);
  await supabase
    .from("migration_status")
    .upsert({ user_id: userId, completed_at: new Date().toISOString() });
  return { migrated: true, data: legacy };
}
