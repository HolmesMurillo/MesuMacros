import { supabase } from "./supabaseClient";

export async function searchMesuFoods(query) {
  if (!supabase) throw new Error("MESU_SEARCH_NOT_CONFIGURED");
  const { data, error } = await supabase.functions.invoke("mesu-food-search", {
    body: { query: query.trim(), pageSize: 24 },
  });
  if (error) {
    let details = null;
    try {
      details = await error.context?.json?.();
    } catch {
      // The Functions client does not always expose a JSON response body.
    }
    const reason = details?.code || error.message || "MESU_SEARCH_FAILED";
    throw new Error(reason);
  }
  if (!Array.isArray(data?.foods)) throw new Error("MESU_SEARCH_FAILED");
  return data.foods;
}
