import assert from "node:assert/strict";
import { translations, translate } from "../src/i18n/translations.js";
import { calculateServingGrams, getServingOptions } from "../src/utils/servings.js";
import { commonFoods } from "../src/data/commonFoods.js";

assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.es).sort());
assert.equal(translate("en", "nav.home"), "Home");
assert.equal(translate("es", "nav.home"), "Inicio");
assert.equal(translate("en", "app.greeting", { name: "Holmes" }), "Hi, Holmes");

const eggOptions = getServingOptions({ id: "catalog-whole-egg", servings: [{ id: "100g", name: "100 g", grams: 100 }] });
assert.equal(eggOptions[0].grams, 50);
assert.equal(calculateServingGrams(2, eggOptions[0]), 100);
assert.equal(getServingOptions({ id: "unknown" }).at(-1).grams, 100);
const egg = commonFoods.find((food) => food.id === "catalog-whole-egg");
assert.equal(Number((egg.nutrientsPer100g.calories * (calculateServingGrams(2, eggOptions[0]) / 100)).toFixed(2)), 176);

console.log("i18n and serving tests passed");
