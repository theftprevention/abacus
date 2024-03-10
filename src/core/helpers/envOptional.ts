import { toStringOrNull } from './toStringOrNull';

export function envOptional<T extends string = string>(key: string): T | null;
export function envOptional(key: string): string | null {
  return toStringOrNull(process.env[key]);
}
