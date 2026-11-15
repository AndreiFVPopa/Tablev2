import {
  canonicalKey,
  CANONICAL_KEYS,
  filterKey,
  isNamespacedKey,
  RANGE_SUBKEYS,
} from "./codec-keys";
import { parseSort, stringifySort, type UrlSortingState } from "./sort";
import { decodeFilterValue, encodeFilterValue, type EncodedFilterParts } from "./value-encoders";

import type { FieldDescriptor } from "../schema/index";
export type UrlColumnFiltersState = readonly {
  readonly id: string;
  readonly value: unknown;
}[];
export type SearchRecord = Readonly<Record<string, unknown>>;
export interface CodecTableState {
  readonly pagination: {
    readonly pageIndex: number;
    readonly pageSize: number;
  };
  readonly sorting: UrlSortingState;
  readonly columnFilters: UrlColumnFiltersState;
}
export interface CodecOptions {
  readonly fields: readonly FieldDescriptor[];
  readonly urlNamespace?: string;
  readonly defaultPageSize: number;
  readonly pageSizes: readonly number[];
}
export type EncodedSearchValue = string | number | boolean;
export function encodeTableState(
  state: CodecTableState,
  options: CodecOptions,
): Record<string, EncodedSearchValue> {
  const out: Record<string, EncodedSearchValue> = {};
  const ns = options.urlNamespace;
  out[canonicalKey("page", ns)] = state.pagination.pageIndex + 1;
  out[canonicalKey("pageSize", ns)] = state.pagination.pageSize;
  out[canonicalKey("sort", ns)] = stringifySort(state.sorting);
  const byId = new Map(state.columnFilters.map((f) => [f.id, f.value]));
  for (const descriptor of options.fields) {
    const value = byId.get(descriptor.path);
    if (value === undefined) continue;
    const parts = encodeFilterValue(value, descriptor);
    writeFilterParts(out, descriptor.path, parts, ns);
  }
  return out;
}
function writeFilterParts(
  out: Record<string, EncodedSearchValue>,
  path: string,
  parts: EncodedFilterParts,
  ns: string | undefined,
): void {
  if (parts.value !== undefined) out[filterKey(path, undefined, ns)] = parts.value;
  if (parts.min !== undefined) out[filterKey(path, "min", ns)] = parts.min;
  if (parts.max !== undefined) out[filterKey(path, "max", ns)] = parts.max;
  if (parts.from !== undefined) out[filterKey(path, "from", ns)] = parts.from;
  if (parts.to !== undefined) out[filterKey(path, "to", ns)] = parts.to;
}
export function decodeTableState(search: SearchRecord, options: CodecOptions): CodecTableState {
  const ns = options.urlNamespace;
  const pagination = decodePagination(search, ns, options);
  const sorting = parseSort(search[canonicalKey("sort", ns)]);
  const columnFilters = decodeAllFilters(search, options, ns);
  return {
    pagination,
    sorting,
    columnFilters,
  };
}
function decodePagination(
  search: SearchRecord,
  ns: string | undefined,
  options: CodecOptions,
): {
  pageIndex: number;
  pageSize: number;
} {
  const rawPage = search[canonicalKey("page", ns)];
  const rawSize = search[canonicalKey("pageSize", ns)];
  const page = toPositiveInt(rawPage) ?? 1;
  const size = toPositiveInt(rawSize) ?? options.defaultPageSize;
  const clampedSize = options.pageSizes.includes(size) ? size : options.defaultPageSize;
  return { pageIndex: Math.max(0, page - 1), pageSize: clampedSize };
}
function decodeAllFilters(
  search: SearchRecord,
  options: CodecOptions,
  ns: string | undefined,
): UrlColumnFiltersState {
  const result: {
    id: string;
    value: unknown;
  }[] = [];
  for (const descriptor of options.fields) {
    const parts = collectParts(search, descriptor.path, ns);
    const value = decodeFilterValue(parts, descriptor);
    if (value !== undefined) result.push({ id: descriptor.path, value });
  }
  return result;
}
function collectParts(
  search: SearchRecord,
  path: string,
  ns: string | undefined,
): EncodedFilterParts {
  const withValue = collectValuePart(search[filterKey(path, undefined, ns)]);
  return RANGE_SUBKEYS.reduce<EncodedFilterParts>((acc, sub) => {
    const raw = search[filterKey(path, sub, ns)];
    if (sub === "min" || sub === "max") {
      const n = coerceFiniteNumber(raw);
      return n === undefined ? acc : { ...acc, [sub]: n };
    }
    const s = coerceString(raw);
    return s === undefined ? acc : { ...acc, [sub]: s };
  }, withValue);
}
function collectValuePart(raw: unknown): EncodedFilterParts {
  if (typeof raw === "boolean") return { value: raw };
  const asString = coerceString(raw);
  return asString === undefined ? {} : { value: asString };
}
export function canonicaliseSearch(
  search: SearchRecord,
  options: CodecOptions,
): Record<string, unknown> {
  const decoded = decodeTableState(search, options);
  const encoded = encodeTableState(decoded, options);
  const preserved = stripTableKeys(search, options);
  return { ...preserved, ...encoded };
}
export function stripTableKeys(
  search: SearchRecord,
  options: CodecOptions,
): Record<string, unknown> {
  const ns = options.urlNamespace;
  const tableKeys = new Set(allTableKeys(options));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(search)) {
    if (!isNamespacedKey(key, ns)) {
      out[key] = value;
      continue;
    }
    if (!tableKeys.has(key)) {
      out[key] = value;
    }
  }
  return out;
}
function allTableKeys(options: CodecOptions): string[] {
  const ns = options.urlNamespace;
  const keys: string[] = CANONICAL_KEYS.map((k) => canonicalKey(k, ns));
  for (const descriptor of options.fields) {
    keys.push(filterKey(descriptor.path, undefined, ns));
    for (const sub of RANGE_SUBKEYS) keys.push(filterKey(descriptor.path, sub, ns));
  }
  return keys;
}
function toPositiveInt(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 1) return n;
  }
  return undefined;
}
function coerceString(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return undefined;
}
function coerceFiniteNumber(raw: unknown): number | undefined {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
export function shallowEqual(a: SearchRecord, b: SearchRecord): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const key of ak) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (a[key] !== b[key]) return false;
  }
  return true;
}
