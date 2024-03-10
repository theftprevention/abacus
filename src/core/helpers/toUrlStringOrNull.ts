import type { UrlString } from '../types';

export function toUrlStringOrNull(
  value: unknown,
  base?: URL | string | null
): UrlString | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(String(value), base || void 0);
    url.protocol = 'https:';
    return url.href as UrlString;
  } catch {
    return null;
  }
}
