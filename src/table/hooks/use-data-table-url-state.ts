import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import { decodeTableState } from "../url/codec/table-state-codec";
import { resolveCodecOptions } from "../url/validation/resolve-codec-options";
import {
  encodeTableStateRetainingAliases,
  shallowEqual,
  stripTableKeys,
} from "../url/validation/search-canonical";

import type { DataTableState } from "../lib/state/table-state";
import type { SearchRecord } from "../url/codec/codec.types";
import type {
  UseDataTableUrlStateOptions,
  UseDataTableUrlStateResult,
} from "./use-data-table-url-state.types";

export type {
  UseDataTableUrlStateOptions,
  UseDataTableUrlStateResult,
} from "./use-data-table-url-state.types";

export function useDataTableUrlState({
  schema,
  urlNamespace,
  pageSizes,
  defaultPageSize,
}: UseDataTableUrlStateOptions): UseDataTableUrlStateResult {
  const codecOptions = useMemo(
    () =>
      resolveCodecOptions(schema, {
        ...(urlNamespace !== undefined ? { urlNamespace } : {}),
        pageSizes,
        defaultPageSize,
      }),
    [schema, urlNamespace, defaultPageSize, pageSizes],
  );
  const search: SearchRecord = useSearch({ strict: false });
  const state = useMemo<DataTableState>(() => {
    const decoded = decodeTableState(search, codecOptions);
    return {
      pagination: decoded.pagination,
      sorting: [...decoded.sorting],
      columnFilters: [...decoded.columnFilters],
    };
  }, [search, codecOptions]);
  const navigate = useNavigate();
  const onStateChange = useCallback(
    (nextState: DataTableState) => {
      const nextTableKeys = encodeTableStateRetainingAliases({
        tableState: nextState,
        options: codecOptions,
        currentSearch: search,
      });
      const preserved = stripTableKeys(search, codecOptions);
      const mergedSearch = { ...preserved, ...nextTableKeys };
      if (shallowEqual(mergedSearch, search)) return;
      void navigate({
        to: ".",
        search: () => mergedSearch,
        replace: false,
        resetScroll: false,
      });
    },
    [codecOptions, navigate, search],
  );
  return { state, onStateChange };
}
