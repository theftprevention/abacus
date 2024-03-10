import type { Guid } from '../types';

export const toGuidOrNull = (() => {
  const guidPattern = /([a-f\d]{8})\-?([a-f\d]{4})\-?([a-f\d]{4})\-?([a-f\d]{4})\-?([a-f\d]{12})/i;
  return function toGuid(value: unknown): Guid | null {
    if (value == null) {
      return null;
    }
    const match = guidPattern.exec(String(value));
    return match ? (match.slice(1, 6).join('-').toLowerCase() as Guid) : null;
  };
})();
