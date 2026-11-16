import { decodeTableState, encodeTableState } from "./table-state-codec";

import type { CodecOptions, SearchRecord } from "./codec.types";

export function stripTableKeys(
  search: SearchRecord,
  options: CodecOptions,
): Record<string, unknown> {
  const preserved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(search)) {
    if (!options.tableSearchKeySet.has(key)) {
      preserved[key] = value;
    }
  }
  return preserved;
}

export function shallowEqual(left: SearchRecord, right: SearchRecord): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (!Object.hasOwn(right, key)) return false;
    if (left[key] !== right[key]) return false;
  }
  return true;
}

export function canonicaliseSearch(search: SearchRecord, options: CodecOptions): SearchRecord {
  const tableState = decodeTableState(search, options);
  const encodedTableSearch = encodeTableState(tableState, options);
  const preservedSearch = stripTableKeys(search, options);
  return { ...preservedSearch, ...encodedTableSearch };
}
