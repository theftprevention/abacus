export function toStringOrNull<T extends string>(value: unknown): T | null;
export function toStringOrNull(value: unknown): string | null {
  return value == null ? null : (String(value) || null);
}
