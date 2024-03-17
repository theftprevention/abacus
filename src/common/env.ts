import { toStringOrNull } from './toStringOrNull';

export function env<T extends string = string>(key: string): T;
export function env(key: string): string {
  const value = toStringOrNull(process.env[key]);
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}
