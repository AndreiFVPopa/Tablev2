import { writeEncodedFilters, readEncodedFilters } from "./filter-value-codec";
import { decodePagination, encodePagination } from "./pagination-codec";
import { TABLE_SEARCH_KEYS, canonicalKey } from "./search-keys";
import { decodeSort, encodeSort } from "./sort-codec";

import type {
  CodecOptions,
  CodecTableState,
  EncodedSearchValue,
  SearchRecord,
} from "./codec.types";

export type { CodecOptions, CodecTableState, SearchRecord } from "./codec.types";

export function encodeTableState(
  tableState: CodecTableState,
  options: CodecOptions,
): Record<string, EncodedSearchValue> {
  const encodedSearch: Record<string, EncodedSearchValue> = {
    ...encodePagination(tableState.pagination, options),
    [canonicalKey(TABLE_SEARCH_KEYS.SORT, options.urlNamespace)]: encodeSort(tableState.sorting),
  };
  writeEncodedFilters({
    encodedSearch,
    columnFilters: tableState.columnFilters,
    options,
  });
  return encodedSearch;
}

export function decodeTableState(search: SearchRecord, options: CodecOptions): CodecTableState {
  return {
    pagination: decodePagination(search, options),
    sorting: decodeSort(search[canonicalKey(TABLE_SEARCH_KEYS.SORT, options.urlNamespace)]),
    columnFilters: readEncodedFilters(search, options),
  };
}
