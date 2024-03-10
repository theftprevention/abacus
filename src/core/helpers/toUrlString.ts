import type { UrlString } from '../types';

export function toUrlString(
  value: unknown,
  base?: URL | string | null
): UrlString {
  const url = new URL((value == null ? value : String(value)) as any, base || void 0);
  url.protocol = 'https:';
  return url.href as UrlString;
}
