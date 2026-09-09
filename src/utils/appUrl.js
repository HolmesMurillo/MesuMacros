const configuredUrl = import.meta.env.VITE_APP_URL;

export function getAppUrl() {
  const fallback = window.location.origin;
  const value = configuredUrl || fallback;
  try {
    const url = new URL(value, fallback);
    if (url.origin !== fallback && !configuredUrl) return fallback;
    return url.origin.replace(/\/+$/, "");
  } catch {
    return fallback.replace(/\/+$/, "");
  }
}
