import { useEffect, useMemo, useRef, useState } from "react";
import AppIcon from "../AppIcon";
import { commonFoods } from "../../data/commonFoods";
import CatalogFoodImage from "../CatalogFoodImage";
import { cleanSearch, normalizeCatalogFood } from "../../utils/catalog";
import { formatDateLabel, getCurrentTime } from "../../utils/dateUtils";
import { getMealLabels, getNutrientLabels } from "../../utils/nutrition";
import { formatMacro } from "../../utils/format";
import { calculateServingGrams, getServingOptions, servingName } from "../../utils/servings";
import { searchMesuFoods } from "../../services/mesuFoodSearch";
import { useLanguage } from "../../context/languageContext";

const emptyFood = {
  name: "", brand: "", amount: "", unit: "g", mealType: "breakfast",
  calories: "", protein: "", carbs: "", fat: "", dateKey: "", time: "",
  nutrients: {}, isFavorite: false,
};

const categoryKeys = ["all", "proteins", "grains", "fruits", "vegetables", "fats"];

function saveErrorMessage(error, t) {
  const message = error?.message || "";
  if (/session|sesión/i.test(message)) return t("log.sessionEnded");
  if (/permission|policy|rls|row level security|403/i.test(message) || error?.status === 403) return t("log.permissionFailed");
  return message || t("log.saveFailed");
}

function displayName(food, language) {
  return food?.name?.[language] || food?.name?.en || food?.name?.es || "";
}

function CatalogDetails({ food, onClose }) {
  const { language, t } = useLanguage();
  const nutrients = [
    ["macro.fiber", food.nutrients.fiber, "g"], ["nutrient.sugars", food.nutrients.sugars, "g"],
    ["nutrient.saturatedFat", food.nutrients.saturatedFat, "g"], ["nutrient.sodium", food.nutrients.sodium, "mg"],
    ["nutrient.potassium", food.nutrients.potassium, "mg"], ["nutrient.calcium", food.nutrients.calcium, "mg"],
    ["nutrient.iron", food.nutrients.iron, "mg"], ["nutrient.vitaminC", food.nutrients.vitaminC, "mg"],
  ];
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card catalog-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label={t("common.close")}>×</button>
        <div className="catalog-modal-heading"><CatalogFoodImage food={food} /><div><span className="eyebrow">{t("log.infoPer100")}</span><h2 id="catalog-detail-title">{displayName(food, language)}</h2>{food.name?.en && language === "es" && <p className="muted">{food.name.en}</p>}</div></div>
        <div className="details-macro-grid">{[["macro.calories", food.calories, "kcal"],["macro.protein",food.protein,"g"],["macro.carbs",food.carbs,"g"],["macro.fat",food.fat,"g"]].map(([key,value,unit]) => <div key={key}><span>{t(key)}</span><strong>{formatMacro(value)} <small>{unit}</small></strong></div>)}</div>
        <div className="details-nutrient-list">{nutrients.map(([key,value,unit]) => <div key={key}><span>{t(key)}</span><strong>{value == null ? t("common.notReported") : `${formatMacro(value)} ${unit}`}</strong></div>)}</div>
        <p className="source-note"><strong>{t("common.source")}:</strong> {food.sourceDescription || food.source}{food.fdcId ? ` · FDC ${food.fdcId}` : ""}</p>
      </section>
    </div>
  );
}

function MesuSearchModal({ onClose, onSelect }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function search(event) {
    event.preventDefault();
    if (query.trim().length < 2) return setError(t("mesu.minChars"));
    setBusy(true); setError("");
    try {
      const foods = await searchMesuFoods(query);
      setResults(foods);
      if (!foods.length) setError(t("mesu.noResults"));
    } catch {
      setResults([]);
      setError(t("mesu.unavailable"));
    } finally { setBusy(false); }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card mesu-search-modal" role="dialog" aria-modal="true" aria-labelledby="mesu-search-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label={t("common.close")}>×</button>
        <span className="eyebrow">MESU + USDA</span>
        <h2 id="mesu-search-title">{t("mesu.title")}</h2>
        <p className="muted">{t("mesu.subtitle")}</p>
        <form className="mesu-search-form" onSubmit={search}>
          <label className="catalog-search"><AppIcon name="search"/><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("mesu.queryPlaceholder")} /></label>
          <button className="primary-button" disabled={busy}>{busy ? t("mesu.searching") : t("mesu.search")}</button>
        </form>
        {error && <p className="form-error" role="alert">{error}</p>}
        {results.length > 0 && <><div className="mesu-results-heading">{t("mesu.results", { count: results.length })}</div><div className="mesu-results">{results.map((result) => (
          <div className="mesu-result" key={result.id}>
            <div className="mesu-result-copy"><strong>{result.name}</strong><span>{[result.brand, result.dataType].filter(Boolean).join(" · ")}</span><small>{formatMacro(result.calories)} kcal · P {formatMacro(result.protein)} g · C {formatMacro(result.carbs)} g · F {formatMacro(result.fat)} g · {t("mesu.resultPer100")}</small></div>
            <button className="outline-button" type="button" onClick={() => onSelect(result)}>{t("mesu.select")}</button>
          </div>
        ))}</div></>}
        <p className="source-note">{t("mesu.powered")}</p>
      </section>
    </div>
  );
}

function PortionControls({ food, busy, onAdd }) {
  const { language, t } = useLanguage();
  const mealLabels = useMemo(() => getMealLabels(t), [t]);
  const servingOptions = useMemo(() => getServingOptions(food), [food]);
  const [quantity, setQuantity] = useState(1);
  const [servingId, setServingId] = useState(servingOptions[0].id);
  const [grams, setGrams] = useState(servingOptions[0].grams);
  const [meal, setMeal] = useState("breakfast");
  const currentServing = servingOptions.find((option) => option.id === servingId) || servingOptions[0];

  function changeQuantity(value) {
    setQuantity(value);
    const nextGrams = calculateServingGrams(value, currentServing);
    if (nextGrams) setGrams(nextGrams);
  }

  function changeServing(nextId) {
    setServingId(nextId);
    const option = servingOptions.find((item) => item.id === nextId);
    const nextGrams = calculateServingGrams(quantity, option);
    if (nextGrams) setGrams(nextGrams);
  }

  return (
    <div className="catalog-add-controls portion-controls">
      <label><span>{t("log.quantity")}</span><input type="number" min="0.25" step="0.25" value={quantity} onChange={(event) => changeQuantity(event.target.value)} /></label>
      <label><span>{t("log.serving")}</span><select value={servingId} onChange={(event) => changeServing(event.target.value)}>{servingOptions.map((option) => <option key={option.id} value={option.id}>{servingName(option, language)}</option>)}</select></label>
      <label><span>{t("log.totalWeight")}</span><div className="amount-input"><input type="number" min="1" step="any" value={grams} onChange={(event) => setGrams(event.target.value)} /><b>g</b></div></label>
      <label><span>{t("log.meal")}</span><select value={meal} onChange={(event) => setMeal(event.target.value)}>{Object.entries(mealLabels).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <button type="button" className="primary-button catalog-add-button" onClick={() => onAdd(grams, meal)} disabled={busy || !food.ready}>{busy ? t("log.saving") : t("log.addToLog")}</button>
      <small className="weight-hint">{t("log.weightHint")}</small>
    </div>
  );
}

export default function LogPage({ selectedDate, editingFood, setEditingFood, showAdvanced, setShowAdvanced, saveFood, onSaved }) {
  const { language, locale, t } = useLanguage();
  const mealLabels = useMemo(() => getMealLabels(t), [t]);
  const nutrientLabels = useMemo(() => getNutrientLabels(t), [t]);
  const [food, setFood] = useState(() => editingFood || { ...emptyFood, dateKey: selectedDate, time: getCurrentTime() });
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [mesuFood, setMesuFood] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mesuOpen, setMesuOpen] = useState(false);
  const catalogRef = useRef(null);
  const catalog = useMemo(() => commonFoods.map(normalizeCatalogFood), []);
  const catalogResults = useMemo(() => catalog.filter((item) => {
    if (catalogCategory !== "all" && item.category !== catalogCategory) return false;
    const haystack = cleanSearch([item.name.es, item.name.en, ...(item.searchTerms?.es || []), ...(item.searchTerms?.en || [])].join(" "));
    return !catalogQuery || haystack.includes(cleanSearch(catalogQuery));
  }), [catalog, catalogCategory, catalogQuery]);
  const localFood = catalogResults.find((item) => item.id === selectedFoodId) || catalogResults[0] || null;
  const displayedFood = mesuFood || localFood;

  useEffect(() => {
    const close = (event) => { if (!catalogRef.current?.contains(event.target)) setCatalogOpen(false); };
    const escape = (event) => { if (event.key === "Escape") { setCatalogOpen(false); setDetailsOpen(false); setMesuOpen(false); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);

  const set = (key, value) => setFood((current) => ({ ...current, [key]: value }));
  const announceSuccess = (message) => { setSuccess(message); window.setTimeout(() => setSuccess(""), 3000); };

  function chooseMesuFood(result) {
    setMesuFood({
      ...result,
      name: { en: result.name, es: result.name },
      ready: true,
      servings: result.serving ? [{ id: "usda-serving", name: result.serving.label, grams: result.serving.grams }] : [],
    });
    setMesuOpen(false);
    setCatalogOpen(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    if (!food.name.trim()) return setError(t("log.enterName"));
    if (!food.amount || Number(food.amount) <= 0) return setError(t("log.invalidAmount"));
    setError(""); setSaving(true);
    try {
      await saveFood({ ...food, dateKey: food.dateKey || selectedDate });
      announceSuccess(editingFood ? t("log.updated") : t("log.saved"));
      setEditingFood(null);
      setFood({ ...emptyFood, dateKey: selectedDate, time: getCurrentTime() });
      onSaved?.();
    } catch (saveError) { setError(saveErrorMessage(saveError, t)); }
    finally { setSaving(false); }
  }

  async function addCatalogFood(amount, catalogMeal) {
    if (!displayedFood?.ready || saving) return;
    const grams = Number(amount);
    if (!Number.isFinite(grams) || grams <= 0) return setError(t("log.invalidAmount"));
    const scale = grams / 100;
    setError(""); setSaving(true);
    try {
      await saveFood({
        name: displayName(displayedFood, language), brand: displayedFood.brand || "", amount: grams, unit: "g",
        mealType: catalogMeal, calories: Number((displayedFood.calories * scale).toFixed(2)),
        protein: Number((displayedFood.protein * scale).toFixed(2)), carbs: Number((displayedFood.carbs * scale).toFixed(2)), fat: Number((displayedFood.fat * scale).toFixed(2)),
        dateKey: selectedDate, time: getCurrentTime(), source: displayedFood.source,
        catalogId: displayedFood.fdcId || displayedFood.id,
        nutrients: Object.fromEntries(Object.entries(displayedFood.nutrients || {}).filter(([, value]) => value != null).map(([key, value]) => [key, Number((Number(value) * scale).toFixed(2))])),
      });
      announceSuccess(t("log.catalogAdded", { name: displayName(displayedFood, language), meal: mealLabels[catalogMeal].toLowerCase() }));
    } catch (saveError) { setError(saveErrorMessage(saveError, t)); }
    finally { setSaving(false); }
  }

  return (
    <section className="page-stack narrow log-page">
      <div className="form-intro"><div><span className="eyebrow">{t("log.newEntry")}</span><h2>{editingFood ? t("log.editFood") : t("log.logFood")}</h2><p className="muted">{t("log.savedFor", { date: formatDateLabel(food.dateKey || selectedDate, locale) })}</p></div>{editingFood && <button className="outline-button" onClick={() => { setEditingFood(null); setFood({ ...emptyFood, dateKey: selectedDate, time: getCurrentTime() }); }}>{t("log.cancelEdit")}</button>}</div>
      {success && <div className="success-banner" role="status"><AppIcon name="check" /> {success}</div>}

      <article className="panel catalog-panel">
        <div className="section-heading"><div><span className="eyebrow">{t("log.verifiedCatalog")}</span><h2>{t("log.commonFoods")}</h2></div><div className="catalog-heading-actions"><small>{t("log.foodCount", { count: catalog.length })}</small><button type="button" className="outline-button mesu-search-button" onClick={() => setMesuOpen(true)}><AppIcon name="search" size={16}/>{t("mesu.button")}</button></div></div>
        <div className="catalog-controls">
          <label className="catalog-search"><AppIcon name="search" /><input value={catalogQuery} onChange={(event) => { setCatalogQuery(event.target.value); setMesuFood(null); }} placeholder={t("log.searchPlaceholder")} aria-label={t("log.searchAria")} /></label>
          <div className="catalog-chips" aria-label={t("log.categories")}>{categoryKeys.map((value) => <button type="button" className={catalogCategory === value ? "selected" : ""} key={value} onClick={() => { setCatalogCategory(value); setSelectedFoodId(null); setMesuFood(null); }}>{t(`category.${value}`)}</button>)}</div>
        </div>
        <div className="catalog-dropdown" ref={catalogRef}>
          {displayedFood ? <>
            <div className="catalog-main-row">
              <button type="button" className="catalog-trigger" aria-expanded={catalogOpen} aria-controls="common-food-options" onClick={() => setCatalogOpen((open) => !open)}>
                <CatalogFoodImage food={displayedFood} /><span className="catalog-food-name"><strong>{displayName(displayedFood, language)}</strong><small>{t("log.per100")}</small></span>
                {[["kcal",displayedFood.calories],["P (g)",displayedFood.protein],["C (g)",displayedFood.carbs],[language === "es" ? "G (g)" : "F (g)",displayedFood.fat]].map(([label,value]) => <span className="catalog-macro-value" key={label}><small>{label}</small><strong>{formatMacro(value)}</strong></span>)}
                <span className={`catalog-chevron${catalogOpen ? " open" : ""}`}><AppIcon name="chevron" /></span>
              </button>
              <button type="button" className="outline-button catalog-details-button" onClick={() => setDetailsOpen(true)}>{t("log.details")}</button>
            </div>
            <PortionControls key={displayedFood.id} food={displayedFood} busy={saving} onAdd={addCatalogFood} />
            {catalogOpen && <div className="catalog-options" id="common-food-options" role="listbox">{catalogResults.map((item) => <button type="button" role="option" aria-selected={!mesuFood && item.id === localFood?.id} className={`catalog-option${!mesuFood && item.id === localFood?.id ? " selected" : ""}`} key={item.id} onClick={() => { setSelectedFoodId(item.id); setMesuFood(null); setCatalogOpen(false); }}><span className="catalog-option-name">{displayName(item, language)}</span><span className="catalog-option-metrics">{formatMacro(item.calories)} kcal · P {formatMacro(item.protein)} g · C {formatMacro(item.carbs)} g · {language === "es" ? "G" : "F"} {formatMacro(item.fat)} g</span></button>)}</div>}
          </> : <p className="catalog-empty">{t("log.noResults")}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      </article>

      <form className="panel form-panel" onSubmit={submit}>
        <div className="section-heading"><div><span className="eyebrow">{t("log.customEntry")}</span><h2>{editingFood ? t("log.updateData") : t("log.logManually")}</h2></div><small>{t("log.requiredFields")}</small></div>
        <div className="form-grid">
          <label className="wide">{t("log.foodName")}<input value={food.name} onChange={(event) => set("name", event.target.value)} placeholder={t("log.foodExample")} /></label>
          <label>{t("log.optionalBrand")}<input value={food.brand || ""} onChange={(event) => set("brand", event.target.value)} placeholder={t("log.optionalBrand")} /></label>
          <label>{t("log.mealType")}<select value={food.mealType} onChange={(event) => set("mealType", event.target.value)}>{Object.entries(mealLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>{t("log.amountRequired")}<input type="number" min="0.01" step="any" value={food.amount} onChange={(event) => set("amount", event.target.value)} placeholder="0" /></label>
          <label>{t("log.unit")}<select value={food.unit} onChange={(event) => set("unit", event.target.value)}>{[["g","grams"],["oz","ounces"],["ml","milliliters"],["cup","cup"],["tbsp","tablespoon"],["unit","unitSingle"],["portion","portion"]].map(([value,key]) => <option key={value} value={value}>{t(`log.${key}`)}</option>)}</select></label>
          <label>{t("log.date")}<input type="date" value={food.dateKey || selectedDate} onChange={(event) => set("dateKey", event.target.value)} /></label>
          <label>{t("log.time")}<input type="time" value={food.time || ""} onChange={(event) => set("time", event.target.value)} /></label>
        </div>
        <div className="form-section"><h3>{t("log.macros")}</h3><div className="form-grid four">{[["calories","macro.calories","kcal"],["protein","macro.protein","g"],["carbs","macro.carbs","g"],["fat","macro.fat","g"]].map(([key,label,unit]) => <label key={key}>{t(label)} <small>({unit})</small><input type="number" min="0" step="any" value={food[key] ?? ""} onChange={(event) => set(key,event.target.value)} placeholder={t("common.notReported")} /></label>)}</div></div>
        <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}><span>{showAdvanced ? "−" : "+"}</span> {t("log.advanced")}</button>
        {showAdvanced && <div className="form-section advanced"><div className="form-grid four">{Object.entries(nutrientLabels).map(([key,label]) => <label key={key}>{label}<input type="number" min="0" step="any" value={food.nutrients?.[key] ?? ""} onChange={(event) => set("nutrients", { ...food.nutrients, [key]: event.target.value })} placeholder={t("common.notReported")} /></label>)}</div></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><label className="favorite-check"><input type="checkbox" checked={Boolean(food.isFavorite)} onChange={(event) => set("isFavorite",event.target.checked)} /> {t("log.favorite")}</label><button type="submit" className="primary-button" disabled={saving}>{saving ? t("log.saving") : editingFood ? t("log.saveChanges") : t("log.saveFood")}</button></div>
      </form>
      {detailsOpen && displayedFood && <CatalogDetails food={displayedFood} onClose={() => setDetailsOpen(false)} />}
      {mesuOpen && <MesuSearchModal onClose={() => setMesuOpen(false)} onSelect={chooseMesuFood} />}
    </section>
  );
}
