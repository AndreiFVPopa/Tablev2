import { TABLE_SEARCH_KEYS, canonicalKey } from "../search-keys/search-keys";

import { toPositiveInt } from "./search-values";

import type {
  CodecOptions,
  CodecPaginationState,
  EncodedSearchValue,
  SearchRecord,
} from "./codec.types";

export function encodePagination(
  pagination: CodecPaginationState,
  options: CodecOptions,
): Record<string, EncodedSearchValue> {
  const urlNamespace = options.urlNamespace;
  return {
    [canonicalKey(TABLE_SEARCH_KEYS.PAGE, urlNamespace)]: pagination.pageIndex + 1,
    [canonicalKey(TABLE_SEARCH_KEYS.PAGE_SIZE, urlNamespace)]: pagination.pageSize,
  };
}

export function decodePagination(
  search: SearchRecord,
  options: CodecOptions,
): CodecPaginationState {
  const urlNamespace = options.urlNamespace;
  const pageNumber = toPositiveInt(search[canonicalKey(TABLE_SEARCH_KEYS.PAGE, urlNamespace)]) ?? 1;
  const requestedPageSize =
    toPositiveInt(search[canonicalKey(TABLE_SEARCH_KEYS.PAGE_SIZE, urlNamespace)]) ??
    options.defaultPageSize;
  const allowedPageSize = options.pageSizes.includes(requestedPageSize)
    ? requestedPageSize
    : options.defaultPageSize;
  return { pageIndex: Math.max(0, pageNumber - 1), pageSize: allowedPageSize };
}
