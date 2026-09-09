export const mealLabels = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};
export const nutrientLabels = {
  fiber: "Fibra",
  sodium: "Sodio",
  potassium: "Potasio",
  calcium: "Calcio",
  iron: "Hierro",
  magnesium: "Magnesio",
  zinc: "Zinc",
  phosphorus: "Fósforo",
  vitaminA: "Vitamina A",
  vitaminC: "Vitamina C",
  vitaminD: "Vitamina D",
  vitaminE: "Vitamina E",
  vitaminK: "Vitamina K",
  vitaminB1: "Vitamina B1",
  vitaminB2: "Vitamina B2",
  vitaminB3: "Vitamina B3",
  vitaminB6: "Vitamina B6",
  folate: "Folato/B9",
  vitaminB12: "Vitamina B12",
  selenium: "Selenio",
  copper: "Cobre",
  manganese: "Manganeso",
};

export function getMealLabels(t) {
  return Object.fromEntries(Object.keys(mealLabels).map((key) => [key, t(`meal.${key}`)]));
}

export function getNutrientLabels(t) {
  return Object.fromEntries(Object.keys(nutrientLabels).map((key) => [key, t(`nutrient.${key}`)]));
}

export function sumNutrition(foods) {
  return foods.reduce(
    (total, food) => {
      total.calories += Number(food.calories) || 0;
      total.protein += Number(food.protein) || 0;
      total.carbs += Number(food.carbs) || 0;
      total.fat += Number(food.fat) || 0;
      Object.entries(food.nutrients || {}).forEach(([key, value]) => {
        const parsed = Number(value);
        if (value !== "" && value != null && Number.isFinite(parsed))
          total[key] = (total[key] || 0) + parsed;
      });
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function calculateGoals(profile) {
  const weight = Number(profile.currentWeight);
  const height = Number(profile.height);
  const age = Number(profile.age);
  if (!weight || !height || !age) return null;
  const base =
    10 * weight +
    6.25 * height -
    5 * age +
    (profile.sex === "female" ? -161 : 5);
  const activity =
    { low: 1.2, light: 1.375, moderate: 1.55, high: 1.725 }[profile.activity] ||
    1.2;
  const maintenance = Math.round(base * activity);
  const pace = Number(profile.pace) || 0.25;
  const dailyChange = Math.round((pace * 7700) / 7);
  const calories = Math.max(
    1200,
    Math.round(
      maintenance +
        ({ lose: -dailyChange, gain: dailyChange, maintain: 0 }[
          profile.goal
        ] || 0),
    ),
  );
  const protein = Math.round(weight * (profile.goal === "gain" ? 1.8 : 1.6));
  return {
    calories,
    protein,
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
    fiber: Math.round(calories / 100),
    water: Math.round(weight * 35),
    maintenance,
  };
}
