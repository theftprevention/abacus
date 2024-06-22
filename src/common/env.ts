import { hasOwnProperty } from './hasOwnProperty';

export function env<T extends string = string>(key: string): T;
export function env(key: string): string {
  const { env } = process;
  if (!hasOwnProperty(env, key)) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  const value = env[key];
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}
