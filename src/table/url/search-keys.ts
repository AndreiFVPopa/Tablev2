import { DATE_RANGE_BOUNDARY } from "@table/filters/date-range-filter/date-range-boundary.constants";
import { NUMBER_RANGE_BOUNDARY } from "@table/filters/number-range-filter/number-range-boundary.constants";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";

import type {
  FilterKeyInput,
  RangeSubKey,
  SearchKeyClaim,
  SearchKeyCollision,
  TableSearchKeysInput,
} from "./search-keys.types";
import type { FieldDescriptor } from "@table/schema/descriptors";
import type { FieldKind } from "@table/schema/field-kinds.constants";

export type { RangeSubKey, SearchKeyCollision } from "./search-keys.types";

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

const CANONICAL_KEY_OWNERS = {
  page: "pagination.page",
  pageSize: "pagination.pageSize",
  sort: "sorting",
} as const satisfies Record<CanonicalKey, string>;

export function namespacePrefix(urlNamespace: string | undefined): string {
  return urlNamespace === undefined || urlNamespace === "" ? "" : `${urlNamespace}.`;
}

export function canonicalKey(canonical: CanonicalKey, urlNamespace: string | undefined): string {
  return namespacePrefix(urlNamespace) + canonical;
}

export function fieldUrlParam(descriptor: FieldDescriptor): string {
  return descriptor.meta.urlParam ?? descriptor.path;
}

export function filterKey({ urlParam, rangeSubKey, urlNamespace }: FilterKeyInput): string {
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

export function allTableSearchKeys(options: TableSearchKeysInput): string[] {
  return searchKeyClaims(options).map((claim) => claim.key);
}

export function buildTableSearchKeySet(options: TableSearchKeysInput): ReadonlySet<string> {
  return new Set(allTableSearchKeys(options));
}

export class SearchKeyCollisionError extends Error {
  readonly collisions: readonly SearchKeyCollision[];

  constructor(collisions: readonly SearchKeyCollision[]) {
    super(collisions.map(formatSearchKeyCollision).join("\n"));
    this.name = "SearchKeyCollisionError";
    this.collisions = collisions;
  }
}

export function assertUniqueSearchKeys(options: TableSearchKeysInput): void {
  const collisions = findSearchKeyCollisions(options);
  if (collisions.length > 0) throw new SearchKeyCollisionError(collisions);
}

function searchKeyClaims(options: TableSearchKeysInput): SearchKeyClaim[] {
  const urlNamespace = options.urlNamespace;
  const claims: SearchKeyClaim[] = CANONICAL_KEY_VALUES.map((canonical) => ({
    key: canonicalKey(canonical, urlNamespace),
    owner: CANONICAL_KEY_OWNERS[canonical],
  }));
  for (const descriptor of options.fields) {
    claims.push(...fieldSearchKeyClaims(descriptor, urlNamespace));
  }
  return claims;
}

function fieldSearchKeyClaims(
  descriptor: FieldDescriptor,
  urlNamespace: string | undefined,
): SearchKeyClaim[] {
  const urlParam = fieldUrlParam(descriptor);
  const rangeSubKeys = rangeSubKeysForKind(descriptor.kind);
  const claims: SearchKeyClaim[] = [
    {
      key: filterKey({ urlParam, urlNamespace }),
      owner: fieldKeyOwner(descriptor.path, rangeSubKeys.length > 0),
    },
  ];
  for (const rangeSubKey of rangeSubKeys) {
    claims.push({
      key: filterKey({ urlParam, rangeSubKey, urlNamespace }),
      owner: `field "${descriptor.path}" ${boundaryOwnerLabel(rangeSubKey)}`,
    });
  }
  return claims;
}

function fieldKeyOwner(path: string, reservesBaseKey: boolean): string {
  return reservesBaseKey ? `field "${path}" reserved base key` : `field "${path}"`;
}

function boundaryOwnerLabel(rangeSubKey: RangeSubKey): string {
  switch (rangeSubKey) {
    case NUMBER_RANGE_BOUNDARY.MINIMUM:
      return "minimum boundary";
    case NUMBER_RANGE_BOUNDARY.MAXIMUM:
      return "maximum boundary";
    case DATE_RANGE_BOUNDARY.FROM:
      return "from boundary";
    case DATE_RANGE_BOUNDARY.TO:
      return "to boundary";
  }
}

function findSearchKeyCollisions(options: TableSearchKeysInput): SearchKeyCollision[] {
  const ownersByKey = new Map<string, string[]>();
  for (const claim of searchKeyClaims(options)) {
    const owners = ownersByKey.get(claim.key);
    if (owners === undefined) {
      ownersByKey.set(claim.key, [claim.owner]);
      continue;
    }
    owners.push(claim.owner);
  }
  const collisions: SearchKeyCollision[] = [];
  for (const [key, owners] of ownersByKey) {
    if (owners.length > 1) collisions.push({ key, owners });
  }
  return collisions;
}

function formatSearchKeyCollision(collision: SearchKeyCollision): string {
  return `URL search key "${collision.key}" is claimed by ${collision.owners.join(" and ")}.`;
}
