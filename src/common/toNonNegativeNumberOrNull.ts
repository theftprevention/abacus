export function toNonNegativeNumberOrNull(value: unknown): number | null {
  switch (value) {
    case null:
    case void 0:
    case '':
      return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
