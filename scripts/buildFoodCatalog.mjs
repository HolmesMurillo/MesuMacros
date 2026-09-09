import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  buildCatalogModule,
  hasCompleteMacros,
  summarizeCandidate,
} from "./usdaCatalogUtils.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const catalogPath = resolve(projectDirectory, "src/data/commonFoods.js");
const reviewPath = resolve(scriptDirectory, "usda-review.json");
const selectionsPath = resolve(scriptDirectory, "usda-selections.json");
const backupDirectory = resolve(scriptDirectory, "backups");
const apiKey = process.env.USDA_API_KEY;
const argumentsList = process.argv.slice(2);
const applyMode = argumentsList.includes("--apply");

if (!applyMode && !apiKey) {
  console.error(
    "Falta USDA_API_KEY. Ejecuta este script con npm run catalog:review.",
  );
  process.exit(1);
}

const catalogUrl = pathToFileURL(catalogPath);
catalogUrl.searchParams.set("updated", Date.now());
const { commonFoods } = await import(catalogUrl.href);

function requestedFoods() {
  const idsArgument = argumentsList.find((item) => item.startsWith("--ids="));
  if (idsArgument) {
    const ids = new Set(
      idsArgument
        .slice("--ids=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    );
    const selected = commonFoods.filter((food) => ids.has(food.id));
    const missing = [...ids].filter(
      (id) => !commonFoods.some((food) => food.id === id),
    );
    if (missing.length)
      throw new Error(`IDs desconocidos: ${missing.join(", ")}`);
    return selected;
  }
  if (argumentsList.includes("--all")) return commonFoods;
  const limitArgument = argumentsList.find((item) =>
    item.startsWith("--limit="),
  );
  const limit = Number(limitArgument?.slice("--limit=".length) || 5);
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error("--limit debe ser un número entero mayor que cero.");
  return commonFoods.slice(0, limit);
}

async function get(path, parameters = {}) {
  const url = new URL(`https://api.nal.usda.gov/fdc/v1/${path}`);
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null)
      url.searchParams.set(key, String(value));
  }
  url.searchParams.set("api_key", apiKey);
  const response = await fetch(url);
  if (!response.ok) {
    const hint =
      response.status === 429
        ? " Se alcanzó el límite temporal de solicitudes. Espera una hora."
        : "";
    throw new Error(`USDA respondió ${response.status}.${hint}`);
  }
  return response.json();
}

function simplifySearchQuery(value) {
  return String(value || "")
    .replace(
      /\b(?:skinless|boneless|bone-in|cooked|raw|roasted|grilled|baked|boiled|fried|drained|dried|fresh|whole|ground|with skin|without skin|meat only|plain|salted|unsalted|natural)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchQueries(value) {
  const variants = new Map();
  const base = String(value || "").trim();
  if (base) {
    variants.set(`${base}|Foundation,SR Legacy,Survey (FNDDS)`, {
      query: base,
      dataType: "Foundation,SR Legacy,Survey (FNDDS)",
    });
    const simplified = simplifySearchQuery(base);
    if (simplified && simplified !== base) {
      variants.set(`${simplified}|`, {
        query: simplified,
        dataType: undefined,
      });
    }
    const shortest = simplified.split(/\s+/).slice(0, 3).join(" ").trim();
    if (shortest && shortest !== simplified && shortest !== base) {
      variants.set(`${shortest}|`, { query: shortest, dataType: undefined });
    }
  }
  return [...variants.values()];
}

async function searchFood(food) {
  const attempts = buildSearchQueries(food.name.en);
  let lastError;

  for (const { query, dataType } of attempts) {
    try {
      const result = await get("foods/search", {
        query,
        dataType,
        pageSize: 5,
      });
      const candidates = (result.foods || [])
        .map((candidate) => summarizeCandidate(food.name.en, candidate))
        .filter((candidate) => candidate.fdcId)
        .sort((left, right) => right.score - left.score);
      return {
        catalogId: food.id,
        name: food.name,
        query: food.name.en,
        recommendedFdcId:
          candidates.find((candidate) => candidate.completeMacros)?.fdcId ||
          null,
        candidates,
        requiresReview: true,
      };
    } catch (error) {
      const message = error?.message || String(error);
      if (/USDA respondió 429/.test(message)) throw error;
      if (/USDA respondió 400|Failed to fetch|network|fetch/i.test(message)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  return {
    catalogId: food.id,
    name: food.name,
    query: food.name.en,
    recommendedFdcId: null,
    candidates: [],
    requiresReview: true,
    error: lastError
      ? lastError.message
      : "No se encontraron candidatos confiables.",
  };
}

async function readReviewReport() {
  try {
    return JSON.parse(await readFile(reviewPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { foods: [] };
    throw error;
  }
}

function mergeReviewFoods(existingFoods, incomingFoods) {
  const map = new Map();
  for (const food of existingFoods || []) {
    if (!food?.catalogId) continue;
    map.set(food.catalogId, {
      ...food,
      candidates: [...(food.candidates || [])],
    });
  }
  for (const incoming of incomingFoods || []) {
    const current = map.get(incoming.catalogId);
    const mergedCandidates = [
      ...(current?.candidates || []),
      ...(incoming.candidates || []),
    ];
    const deduplicated = Array.from(
      new Map(
        mergedCandidates.map((candidate) => [
          String(candidate.fdcId),
          candidate,
        ]),
      ).values(),
    );
    map.set(incoming.catalogId, {
      ...(current || {}),
      ...incoming,
      candidates: deduplicated,
      requiresReview: true,
    });
  }
  return [...map.values()];
}

async function createReview() {
  const foods = requestedFoods().filter(
    (food) => food.dataType === "pending_verification" || !food.dataType,
  );
  const report = await readReviewReport();
  let reviewedFoods = Array.isArray(report.foods) ? [...report.foods] : [];

  for (const [index, food] of foods.entries()) {
    process.stdout.write(
      `[${index + 1}/${foods.length}] Buscando ${food.name.es}... `,
    );
    try {
      const review = await searchFood(food);
      reviewedFoods = mergeReviewFoods(reviewedFoods, [review]);
      await writeFile(
        reviewPath,
        `${JSON.stringify({ ...report, foods: reviewedFoods }, null, 2)}\n`,
      );
      console.log(`${review.candidates.length} candidatos`);
    } catch (error) {
      const failed = {
        catalogId: food.id,
        name: food.name,
        query: food.name.en,
        recommendedFdcId: null,
        candidates: [],
        requiresReview: true,
        error: error.message,
      };
      reviewedFoods = mergeReviewFoods(reviewedFoods, [failed]);
      await writeFile(
        reviewPath,
        `${JSON.stringify({ ...report, foods: reviewedFoods }, null, 2)}\n`,
      );
      console.log(`error: ${error.message}`);
      if (/429/.test(error.message)) {
        console.log(
          "Se alcanzó el límite temporal de USDA. Se conservó el progreso y se detuvo la revisión.",
        );
        break;
      }
    }
  }

  const finalReport = {
    generatedAt: new Date().toISOString(),
    source: "USDA FoodData Central",
    instructions:
      "Revisa cada descripción. Copia únicamente los FDC ID aprobados a scripts/usda-selections.json antes de aplicar.",
    foods: reviewedFoods,
  };
  await writeFile(reviewPath, `${JSON.stringify(finalReport, null, 2)}\n`);
  console.log(
    "Reporte actualizado en scripts/usda-review.json. El catálogo no fue modificado.",
  );
}

async function readSelections() {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(selectionsPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT")
      throw new Error(
        "Falta scripts/usda-selections.json. Copia usda-selections.example.json y agrega las selecciones revisadas.",
      );
    throw new Error("scripts/usda-selections.json no contiene JSON válido.");
  }
  const selections = parsed.selections || parsed;
  const entries = Object.entries(selections).filter(
    ([key]) => !key.startsWith("_"),
  );
  if (!entries.length) throw new Error("No hay selecciones USDA para aplicar.");
  return Object.fromEntries(
    entries.map(([catalogId, fdcId]) => {
      const number = Number(fdcId);
      if (!Number.isInteger(number) || number <= 0)
        throw new Error(`FDC ID inválido para ${catalogId}.`);
      return [catalogId, number];
    }),
  );
}

async function readReviewedReport() {
  try {
    return JSON.parse(await readFile(reviewPath, "utf8"));
  } catch {
    throw new Error(
      "Primero genera scripts/usda-review.json con npm run catalog:review.",
    );
  }
}

async function assertSelectionsWereReviewed(selections) {
  const report = await readReviewedReport();
  const reviewedSelections = new Map();

  for (const [catalogId, fdcId] of Object.entries(selections)) {
    const reviewedFood = report.foods?.find(
      (food) => food.catalogId === catalogId,
    );
    if (!reviewedFood)
      throw new Error(`${catalogId} no aparece en el reporte revisado.`);

    const candidate = reviewedFood.candidates?.find(
      (entry) => entry.fdcId === fdcId,
    );
    if (!candidate)
      throw new Error(
        `El FDC ID ${fdcId} no fue uno de los candidatos revisados para ${catalogId}.`,
      );

    if (!hasCompleteMacros(candidate.nutrients))
      throw new Error(
        `Macros incompletos para ${reviewedFood.name?.en || catalogId} (${fdcId}).`,
      );

    reviewedSelections.set(catalogId, {
      food: reviewedFood,
      candidate,
    });
  }

  return reviewedSelections;
}

async function applySelections() {
  const selections = await readSelections();
  const knownIds = new Set(commonFoods.map((food) => food.id));
  const unknown = Object.keys(selections).filter((id) => !knownIds.has(id));
  if (unknown.length)
    throw new Error(`Selecciones con IDs desconocidos: ${unknown.join(", ")}`);

  const reviewedSelections = await assertSelectionsWereReviewed(selections);
  const updates = new Map();
  const selectedEntries = Object.entries(selections);

  for (const [index, [catalogId, fdcId]] of selectedEntries.entries()) {
    const food = commonFoods.find((item) => item.id === catalogId);
    const reviewed = reviewedSelections.get(catalogId);
    if (!food || !reviewed)
      throw new Error(`Selección no válida para ${catalogId}.`);

    const { candidate } = reviewed;
    process.stdout.write(
      `[${index + 1}/${selectedEntries.length}] Aplicando ${food.name.es}... `,
    );

    const nutrientsPer100g = candidate.nutrients;
    if (!hasCompleteMacros(nutrientsPer100g))
      throw new Error(`Macros incompletos para ${food.name.en} (${fdcId}).`);

    updates.set(catalogId, {
      ...food,
      source: "USDA FoodData Central",
      sourceDescription: candidate.description || food.name.en,
      fdcId: candidate.fdcId,
      dataType: candidate.dataType || "USDA",
      verifiedAt: new Date().toISOString().slice(0, 10),
      nutrientsPer100g,
    });
    console.log("listo");
  }

  const generated = commonFoods.map((food) => updates.get(food.id) || food);
  const verifiedCount = generated.filter(
    (food) =>
      food.dataType !== "pending_verification" &&
      hasCompleteMacros(food.nutrientsPer100g),
  ).length;
  const metadata = {
    source: "USDA FoodData Central",
    status:
      verifiedCount === generated.length
        ? "verified"
        : verifiedCount > 0
          ? "partial"
          : "pending_verification",
    verifiedAt: new Date().toISOString().slice(0, 10),
    verifiedCount,
    totalCount: generated.length,
  };

  await mkdir(backupDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = resolve(backupDirectory, `commonFoods-${timestamp}.js`);
  await copyFile(catalogPath, backupPath);
  await writeFile(catalogPath, buildCatalogModule(generated, metadata));
  console.log(
    `Catálogo actualizado: ${verifiedCount}/${generated.length} alimentos verificados.`,
  );
  console.log("Respaldo creado en scripts/backups/.");
}

try {
  if (applyMode) await applySelections();
  else await createReview();
} catch (error) {
  console.error(`No se modificó el catálogo: ${error.message}`);
  process.exitCode = 1;
}
