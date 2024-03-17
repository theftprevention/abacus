const timestampReplacements = /[:\.]/g;

export function sanitizeTimestamp(timestamp?: Date | number): string {
  return (
    timestamp == null ? new Date() : timestamp instanceof Date ? timestamp : new Date(timestamp)
  ).toISOString().replace(timestampReplacements, '-');
}
