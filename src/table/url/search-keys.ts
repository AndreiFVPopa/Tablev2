import { DATE_RANGE_BOUNDARY } from "@table/filters/date-range-filter/date-range-boundary.constants";
import { NUMBER_RANGE_BOUNDARY } from "@table/filters/number-range-filter/number-range-boundary.constants";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";

import type { FieldDescriptor } from "@table/schema/descriptors";
import type { FieldKind } from "@table/schema/field-kinds.constants";

export type CanonicalKey = "page" | "pageSize" | "sort";

export const TABLE_SEARCH_KEYS = {
  PAGE: "page",
  PAGE_SIZE: "pageSize",
  SORT: "sort",
} as const satisfies Record<string, CanonicalKey>;

const CANONICAL_KEY_VALUES: readonly CanonicalKey[] = [
  TABLE_SEARCH_KEYS.PAGE,
  TABLE_SEARCH_KEYS.PAGE_SIZE,
  TABLE_SEARCH_KEYS.SORT,
];

export type RangeSubKey =
  | typeof NUMBER_RANGE_BOUNDARY.MINIMUM
  | typeof NUMBER_RANGE_BOUNDARY.MAXIMUM
  | typeof DATE_RANGE_BOUNDARY.FROM
  | typeof DATE_RANGE_BOUNDARY.TO;

export function namespacePrefix(urlNamespace: string | undefined): string {
  return urlNamespace === undefined || urlNamespace === "" ? "" : `${urlNamespace}.`;
}

export function canonicalKey(canonical: CanonicalKey, urlNamespace: string | undefined): string {
  return namespacePrefix(urlNamespace) + canonical;
}

export function fieldUrlParam(descriptor: FieldDescriptor): string {
  return descriptor.meta.urlParam ?? descriptor.path;
}

export function filterKey(
  urlParam: string,
  rangeSubKey: RangeSubKey | undefined,
  urlNamespace: string | undefined,
): string {
  const base = namespacePrefix(urlNamespace) + urlParam;
  return rangeSubKey === undefined ? base : `${base}.${rangeSubKey}`;
}

export function rangeSubKeysForKind(kind: FieldKind): readonly RangeSubKey[] {
  switch (kind) {
    case FIELD_KINDS.NUMERIC:
      return [NUMBER_RANGE_BOUNDARY.MINIMUM, NUMBER_RANGE_BOUNDARY.MAXIMUM];
    case FIELD_KINDS.DATE:
      return [DATE_RANGE_BOUNDARY.FROM, DATE_RANGE_BOUNDARY.TO];
    case FIELD_KINDS.TEXT:
    case FIELD_KINDS.BOOLEAN:
    case FIELD_KINDS.ENUM:
    case FIELD_KINDS.TAGS:
      return [];
  }
}

export function allTableSearchKeys(options: {
  readonly fields: readonly FieldDescriptor[];
  readonly urlNamespace?: string;
}): string[] {
  const urlNamespace = options.urlNamespace;
  const keys: string[] = CANONICAL_KEY_VALUES.map((key) => canonicalKey(key, urlNamespace));
  for (const descriptor of options.fields) {
    const urlParam = fieldUrlParam(descriptor);
    keys.push(filterKey(urlParam, undefined, urlNamespace));
    for (const rangeSubKey of rangeSubKeysForKind(descriptor.kind)) {
      keys.push(filterKey(urlParam, rangeSubKey, urlNamespace));
    }
  }
  return keys;
}

export function buildTableSearchKeySet(options: {
  readonly fields: readonly FieldDescriptor[];
  readonly urlNamespace?: string;
}): ReadonlySet<string> {
  return new Set(allTableSearchKeys(options));
}
