export function formatMacro(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return Number(number.toFixed(digits));
}
