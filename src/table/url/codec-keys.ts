import { DATE_RANGE_BOUNDARY } from "@table/filters/date-range-filter/date-range-boundary.constants";
import { NUMBER_RANGE_BOUNDARY } from "@table/filters/number-range-filter/number-range-boundary.constants";

export const CANONICAL_KEYS = ["page", "pageSize", "sort"] as const;
export type CanonicalKey = (typeof CANONICAL_KEYS)[number];

export const RANGE_SUBKEYS = [
  NUMBER_RANGE_BOUNDARY.MINIMUM,
  NUMBER_RANGE_BOUNDARY.MAXIMUM,
  DATE_RANGE_BOUNDARY.FROM,
  DATE_RANGE_BOUNDARY.TO,
] as const;

export type RangeSubKey = (typeof RANGE_SUBKEYS)[number];

export function canonicalKey(canonical: CanonicalKey, urlNamespace: string | undefined): string {
  return namespacePrefix(urlNamespace) + canonical;
}

export function filterKey(
  path: string,
  rangeSubKey: RangeSubKey | undefined,
  urlNamespace: string | undefined,
): string {
  const base = namespacePrefix(urlNamespace) + path;
  return rangeSubKey === undefined ? base : `${base}.${rangeSubKey}`;
}

export function namespacePrefix(urlNamespace: string | undefined): string {
  return urlNamespace === undefined || urlNamespace === "" ? "" : `${urlNamespace}.`;
}

export function isNamespacedKey(key: string, urlNamespace: string | undefined): boolean {
  const prefixValue = namespacePrefix(urlNamespace);
  if (prefixValue === "") return true;
  return key.startsWith(prefixValue);
}

export function stripNamespace(key: string, urlNamespace: string | undefined): string | undefined {
  const prefixValue = namespacePrefix(urlNamespace);
  if (prefixValue === "") return key;
  return key.startsWith(prefixValue) ? key.slice(prefixValue.length) : undefined;
}
