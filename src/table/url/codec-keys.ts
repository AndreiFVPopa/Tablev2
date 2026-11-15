export const CANONICAL_KEYS = ["page", "pageSize", "sort"] as const;
export type CanonicalKey = (typeof CANONICAL_KEYS)[number];
export const RANGE_SUBKEYS = ["min", "max", "from", "to"] as const;
export type RangeSubKey = (typeof RANGE_SUBKEYS)[number];
export function canonicalKey(canonical: CanonicalKey, urlNamespace: string | undefined): string {
  return prefix(urlNamespace) + canonical;
}
export function filterKey(
  path: string,
  sub: RangeSubKey | undefined,
  urlNamespace: string | undefined,
): string {
  const base = prefix(urlNamespace) + path;
  return sub === undefined ? base : `${base}.${sub}`;
}
export function prefix(urlNamespace: string | undefined): string {
  return urlNamespace === undefined || urlNamespace === "" ? "" : `${urlNamespace}.`;
}
export function isNamespacedKey(key: string, urlNamespace: string | undefined): boolean {
  const p = prefix(urlNamespace);
  if (p === "") return true;
  return key.startsWith(p);
}
export function stripNamespace(key: string, urlNamespace: string | undefined): string | undefined {
  const p = prefix(urlNamespace);
  if (p === "") return key;
  return key.startsWith(p) ? key.slice(p.length) : undefined;
}
