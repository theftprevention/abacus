import { toNonNegativeIntegerOrNull } from './toNonNegativeIntegerOrNull';

export function envInteger<T extends number = number>(key: string): T;
export function envInteger(key: string): number {
  const raw = process.env[key];
  const value = toNonNegativeIntegerOrNull(raw);
  if (value == null) {
    throw new Error(
      value === void 0
        ? `Missing environment variable: ${key}`
        : `Cannot convert environment variable ${key} from ${typeof raw === 'string' ? `"${raw}"` : String(raw)} to an integer`
    );
  }
  return value;
}
