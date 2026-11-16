import { isPlainRecord } from "./is-plain-record";

export function getValueAtPath(row: unknown, segments: readonly string[]): unknown {
  let current: unknown = row;
  for (const segment of segments) {
    if (!isPlainRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}
