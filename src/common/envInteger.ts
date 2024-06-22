import { env } from './env';
import { toNonNegativeIntegerOrNull } from './toNonNegativeIntegerOrNull';

export function envInteger<T extends number = number>(key: string): T;
export function envInteger(key: string): number {
  const raw = env(key);
  const value = toNonNegativeIntegerOrNull(raw);
  if (value == null) {
    throw new TypeError(`Cannot convert environment variable ${key} from "${raw}" to an integer`);
  }
  return value;
}
