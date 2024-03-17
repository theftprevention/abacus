import type { HttpUrlString } from './types';

export function toHttpUrlStringOrNull(
  value: unknown,
  base?: URL | string | null
): HttpUrlString | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(String(value), base || void 0);
    url.protocol = 'https:';
    return url.href as HttpUrlString;
  } catch {
    return null;
  }
}
