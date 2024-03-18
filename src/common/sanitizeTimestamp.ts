const removePattern = /[Z:\-]/gi;
const replacePattern = /[T\.]/gi;

export function sanitizeTimestamp(timestamp?: Date | number): string {
  return new Date(timestamp ?? Date.now())
    .toISOString()
    .replace(removePattern, '')
    .replace(replacePattern, '-');
}
