import { FIELD_KINDS } from "@table/schema/field-kinds.constants";

import { decodeTableState, encodeTableState } from "../codec/table-state-codec";
import { fieldUrlParam, filterKey } from "../search-keys/search-keys";

import type {
  CodecOptions,
  CodecTableState,
  EncodedSearchValue,
  SearchRecord,
} from "../codec/codec.types";

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
    if (!Object.is(left[key], right[key])) return false;
  }
  return true;
}

export function encodeTableStateRetainingAliases(input: {
  readonly tableState: CodecTableState;
  readonly options: CodecOptions;
  readonly currentSearch: SearchRecord;
}): Record<string, EncodedSearchValue> {
  const encoded = encodeTableState(input.tableState, input.options);
  retainUnchangedFilterAliases({ encoded, ...input });
  return encoded;
}

export function canonicaliseSearch(search: SearchRecord, options: CodecOptions): SearchRecord {
  const tableState = decodeTableState(search, options);
  const encodedTableSearch = encodeTableStateRetainingAliases({
    tableState,
    options,
    currentSearch: search,
  });
  const preservedSearch = stripTableKeys(search, options);
  const canonicalSearch: Record<string, unknown> = {
    ...preservedSearch,
    ...encodedTableSearch,
  };
  for (const key of Object.keys(search)) {
    if (options.tableSearchKeySet.has(key) && !Object.hasOwn(encodedTableSearch, key)) {
      canonicalSearch[key] = undefined;
    }
  }
  return canonicalSearch;
}

function retainUnchangedFilterAliases(input: {
  readonly encoded: Record<string, EncodedSearchValue>;
  readonly tableState: CodecTableState;
  readonly options: CodecOptions;
  readonly currentSearch: SearchRecord;
}): void {
  const currentValues = new Map(
    decodeTableState(input.currentSearch, input.options).columnFilters.map((filter) => [
      filter.id,
      filter.value,
    ]),
  );
  for (const descriptor of input.options.fields) {
    if (descriptor.kind !== FIELD_KINDS.BOOLEAN && descriptor.kind !== FIELD_KINDS.ENUM) continue;
    const nextFilter = input.tableState.columnFilters.find(
      (filter) => filter.id === descriptor.path,
    );
    if (nextFilter === undefined) continue;
    if (!Object.is(currentValues.get(descriptor.path), nextFilter.value)) continue;
    const key = filterKey({
      urlParam: fieldUrlParam(descriptor),
      urlNamespace: input.options.urlNamespace,
    });
    const rawValue = input.currentSearch[key];
    if (isEncodedSearchValue(rawValue)) input.encoded[key] = rawValue;
  }
}

function isEncodedSearchValue(value: unknown): value is EncodedSearchValue {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
