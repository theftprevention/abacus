export function toNonNegativeNumberOrNull(value: unknown): number | null {
  if (value == null) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
