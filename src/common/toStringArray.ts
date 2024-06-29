export function toStringArray(value: unknown): readonly string[] {
  let strings: string[] = [];
  if (value) {
    if (typeof value === 'string') {
      strings[0] = value;
    } else if (typeof value === 'object') {
      let index = 0;
      let string: string;
      for (const item of (Array.isArray(value) ? value : Array.from(value as any)) as unknown[]) {
        if (item != null && (string = String(item))) {
          strings[index++] = string;
        }
      }
    }
  }
  return Object.freeze(strings);
}
