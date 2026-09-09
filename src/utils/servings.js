const portions = {
  "catalog-whole-egg": ["large-egg", 50, "1 huevo grande", "1 large egg"],
  "catalog-egg-white": ["large-white", 33, "1 clara grande", "1 large egg white"],
  "catalog-greek-yogurt": ["cup", 245, "1 taza", "1 cup"],
  "catalog-cottage-cheese": ["half-cup", 113, "½ taza", "½ cup"],
  "catalog-whole-milk": ["cup", 244, "1 taza", "1 cup"],
  "catalog-two-percent-milk": ["cup", 244, "1 taza", "1 cup"],
  "catalog-skim-milk": ["cup", 245, "1 taza", "1 cup"],
  "catalog-cheddar": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-mozzarella": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-peanut-butter": ["tablespoon", 16, "1 cucharada", "1 tbsp"],
  "catalog-white-rice": ["cup", 158, "1 taza cocida", "1 cup cooked"],
  "catalog-brown-rice": ["cup", 195, "1 taza cocida", "1 cup cooked"],
  "catalog-quinoa": ["cup", 185, "1 taza cocida", "1 cup cooked"],
  "catalog-oats": ["half-cup", 40, "½ taza seca", "½ cup dry"],
  "catalog-white-pasta": ["cup", 140, "1 taza cocida", "1 cup cooked"],
  "catalog-whole-pasta": ["cup", 140, "1 taza cocida", "1 cup cooked"],
  "catalog-white-bread": ["slice", 25, "1 rebanada", "1 slice"],
  "catalog-whole-bread": ["slice", 28, "1 rebanada", "1 slice"],
  "catalog-corn-tortilla": ["tortilla", 24, "1 tortilla", "1 tortilla"],
  "catalog-flour-tortilla": ["tortilla", 49, "1 tortilla mediana", "1 medium tortilla"],
  "catalog-arepa": ["arepa", 100, "1 arepa mediana", "1 medium arepa"],
  "catalog-rice-cake": ["cake", 9, "1 tortita", "1 cake"],
  "catalog-banana": ["medium", 118, "1 mediano", "1 medium"],
  "catalog-apple": ["medium", 182, "1 mediana", "1 medium"],
  "catalog-orange": ["medium", 131, "1 mediana", "1 medium"],
  "catalog-mandarin": ["medium", 88, "1 mediana", "1 medium"],
  "catalog-strawberries": ["cup", 152, "1 taza", "1 cup"],
  "catalog-blueberries": ["cup", 148, "1 taza", "1 cup"],
  "catalog-raspberries": ["cup", 123, "1 taza", "1 cup"],
  "catalog-grapes": ["cup", 151, "1 taza", "1 cup"],
  "catalog-mango": ["cup", 165, "1 taza", "1 cup"],
  "catalog-pineapple": ["cup", 165, "1 taza", "1 cup"],
  "catalog-watermelon": ["cup", 152, "1 taza", "1 cup"],
  "catalog-cantaloupe": ["cup", 156, "1 taza", "1 cup"],
  "catalog-papaya": ["cup", 145, "1 taza", "1 cup"],
  "catalog-avocado": ["half", 100, "½ aguacate mediano", "½ medium avocado"],
  "catalog-peach": ["medium", 150, "1 mediano", "1 medium"],
  "catalog-pear": ["medium", 178, "1 mediana", "1 medium"],
  "catalog-kiwi": ["fruit", 69, "1 kiwi", "1 kiwi"],
  "catalog-cherries": ["cup", 138, "1 taza sin semilla", "1 cup pitted"],
  "catalog-grapefruit": ["half", 123, "½ toronja", "½ grapefruit"],
  "catalog-lemon": ["fruit", 58, "1 limón", "1 lemon"],
  "catalog-tomato": ["medium", 123, "1 mediano", "1 medium"],
  "catalog-carrot": ["medium", 61, "1 mediana", "1 medium"],
  "catalog-onion": ["medium", 110, "1 mediana", "1 medium"],
  "catalog-celery": ["stalk", 40, "1 tallo", "1 stalk"],
  "catalog-garlic": ["clove", 3, "1 diente", "1 clove"],
  "catalog-olive-oil": ["tablespoon", 13.5, "1 cucharada", "1 tbsp"],
  "catalog-butter": ["tablespoon", 14.2, "1 cucharada", "1 tbsp"],
  "catalog-almonds": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-walnuts": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-cashews": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-pistachios": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-hazelnuts": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-brazil-nuts": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-pecans": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-macadamia-nuts": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-chia": ["tablespoon", 12, "1 cucharada", "1 tbsp"],
  "catalog-flax": ["tablespoon", 7, "1 cucharada", "1 tbsp"],
  "catalog-pumpkin-seeds": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-sunflower-seeds": ["ounce", 28, "1 oz", "1 oz"],
  "catalog-sesame-seeds": ["tablespoon", 9, "1 cucharada", "1 tbsp"],
  "catalog-tahini": ["tablespoon", 15, "1 cucharada", "1 tbsp"],
  "catalog-almond-butter": ["tablespoon", 16, "1 cucharada", "1 tbsp"],
  "catalog-coconut-oil": ["tablespoon", 13.6, "1 cucharada", "1 tbsp"],
  "catalog-popcorn": ["cup", 8, "1 taza", "1 cup"],
  "catalog-dark-chocolate": ["square", 10, "1 cuadrito", "1 square"],
};

function optionFromTuple(tuple) {
  if (!tuple) return null;
  const [id, grams, es, en] = tuple;
  return { id, grams, name: { es: `${es} (${grams} g)`, en: `${en} (${grams} g)` } };
}

export function getServingOptions(food) {
  const known = optionFromTuple(portions[food?.id]);
  const supplied = (food?.servings || [])
    .filter((serving) => Number(serving.grams) > 0)
    .map((serving) => ({
      id: serving.id || `serving-${serving.grams}`,
      grams: Number(serving.grams),
      name: typeof serving.name === "object"
        ? serving.name
        : { es: serving.name || `${serving.grams} g`, en: serving.name || `${serving.grams} g` },
    }));
  const options = [...(known ? [known] : []), ...supplied];
  if (!options.some((option) => option.grams === 100)) {
    options.push({ id: "100g", grams: 100, name: { es: "100 g", en: "100 g" } });
  }
  return options.filter((option, index) => options.findIndex((candidate) => candidate.id === option.id) === index);
}

export function servingName(option, language) {
  return option?.name?.[language] || option?.name?.en || option?.name?.es || `${option?.grams || 100} g`;
}

export function calculateServingGrams(quantity, serving) {
  const count = Number(quantity);
  const grams = Number(serving?.grams);
  return Number.isFinite(count) && count > 0 && Number.isFinite(grams) && grams > 0
    ? Number((count * grams).toFixed(2))
    : 0;
}
