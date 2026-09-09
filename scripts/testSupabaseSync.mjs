import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/services/supabaseData.js", import.meta.url),
  "utf8",
);

assert.match(
  source,
  /\.from\("nutrition_goals"\)\s+\.upsert\(goals,\s*\{\s*onConflict:\s*"user_id"\s*\}\)/,
);

console.log("Sincronización de objetivos protegida por user_id.");
