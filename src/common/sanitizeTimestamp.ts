const removePattern = /[Z:\-]/gi;
const replacePattern = /[T\.]/gi;

export function sanitizeTimestamp(timestamp?: Date | number): string {
  const date = new Date(timestamp ?? Date.now());
  const offsetMinutes = date.getTimezoneOffset();
  if (offsetMinutes) {
    date.setUTCMinutes(date.getUTCMinutes() - offsetMinutes);
  }
  return date.toISOString().replace(removePattern, '').replace(replacePattern, '-');
}
