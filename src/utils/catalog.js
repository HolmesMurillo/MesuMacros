import macroProteinImage from "../assets/macro-icons/macro-protein.png";
import macroCarbsImage from "../assets/macro-icons/macro-carbs.png";
import macroFatImage from "../assets/macro-icons/macro-fat.png";

export function parseCatalogNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeCatalogFood(item) {
  const raw = item?.nutrientsPer100g ?? item?.macros ?? item?.nutrients ?? {};
  const name = item?.name ?? {};
  const calories = parseCatalogNumber(raw.calories ?? item?.calories ?? item?.kcal);
  const protein = parseCatalogNumber(raw.protein ?? item?.protein ?? item?.protein_g);
  const carbs = parseCatalogNumber(raw.carbs ?? item?.carbs ?? item?.carbohydrates);
  const fat = parseCatalogNumber(raw.fat ?? item?.fat ?? item?.fats);
  const nutrients = Object.fromEntries(
    Object.entries(raw)
      .filter(([key, value]) => !["calories", "kcal", "protein", "protein_g", "carbs", "carbohydrates", "fat", "fats"].includes(key) && parseCatalogNumber(value) !== null)
      .map(([key, value]) => [key, Number(value)]),
  );
  return {
    ...item,
    name: {
      es: name.es ?? name.es_ES ?? item?.label ?? "",
      en: name.en ?? name.en_US ?? item?.name_en ?? (typeof item?.name === "string" ? item.name : ""),
    },
    calories,
    protein,
    carbs,
    fat,
    nutrients,
    source: item?.source || "USDA FoodData Central",
    ready: [calories, protein, carbs, fat].every((value) => value !== null),
  };
}

export function cleanSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function getMacroImage(food) {
  const energies = [
    [(food.protein ?? 0) * 4, macroProteinImage],
    [(food.carbs ?? 0) * 4, macroCarbsImage],
    [(food.fat ?? 0) * 9, macroFatImage],
  ];
  return energies.reduce((winner, current) => current[0] > winner[0] ? current : winner)[1];
}
