const dateFormatterCache = new Map();

export function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function getLocalDateKey(date = new Date(), timeZone = getTimeZone()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date).reduce((values, part) => {
    if (part.type !== "literal") values[part.type] = part.value;
    return values;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function parseLocalDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateLabel(dateKey, locale = "es-ES") {
  if (!dateFormatterCache.has(locale)) {
    dateFormatterCache.set(
      locale,
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }
  const label = dateFormatterCache
    .get(locale)
    .format(parseLocalDateKey(dateKey));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatShortDate(dateKey, options = {}, locale = "es-ES") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...options,
  }).format(parseLocalDateKey(dateKey));
}

export function shiftDateKey(dateKey, days) {
  const date = parseLocalDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getCurrentTime() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}
