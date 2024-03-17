import type { HttpUrlString } from '../types';

export function toHttpUrlString(
  value: unknown,
  base?: URL | string | null
): HttpUrlString {
  const url = new URL((value == null ? value : String(value)) as any, base || void 0);
  url.protocol = 'https:';
  return url.href as HttpUrlString;
}
