import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import { interpretSchema } from "../schema/index";
import {
  decodeTableState,
  encodeTableState,
  shallowEqual,
  stripTableKeys,
  type CodecOptions,
  type SearchRecord,
} from "../url/codec";

import type { DataTableState } from "../lib/table-state";
import type { z } from "zod";
export interface UseDataTableUrlStateOptions {
  readonly schema: z.ZodType;
  readonly urlNamespace?: string;
  readonly pageSizes: readonly number[];
  readonly defaultPageSize: number;
}
export interface UseDataTableUrlStateResult {
  readonly state: DataTableState;
  readonly onStateChange: (next: DataTableState) => void;
}
export function useDataTableUrlState({
  schema,
  urlNamespace,
  pageSizes,
  defaultPageSize,
}: UseDataTableUrlStateOptions): UseDataTableUrlStateResult {
  const codecOptions = useMemo<CodecOptions>(() => {
    const { fields } = interpretSchema(schema);
    return {
      fields,
      ...(urlNamespace !== undefined ? { urlNamespace } : {}),
      defaultPageSize,
      pageSizes,
    };
  }, [schema, urlNamespace, defaultPageSize, pageSizes]);
  const search: SearchRecord = useSearch({ strict: false });
  const state = useMemo<DataTableState>(() => {
    const decoded = decodeTableState(search, codecOptions);
    return {
      pagination: { ...decoded.pagination },
      sorting: decoded.sorting.map((entry) => ({ id: entry.id, desc: entry.desc })),
      columnFilters: decoded.columnFilters.map((entry) => ({
        id: entry.id,
        value: entry.value,
      })),
    };
  }, [search, codecOptions]);
  const navigate = useNavigate();
  const onStateChange = useCallback(
    (next: DataTableState) => {
      const nextTableKeys = encodeTableState(next, codecOptions);
      const preserved = stripTableKeys(search, codecOptions);
      const merged = { ...preserved, ...nextTableKeys };
      if (shallowEqual(merged, search)) return;
      void navigate({
        to: ".",
        search: () => merged,
        replace: false,
        resetScroll: false,
      });
    },
    [codecOptions, navigate, search],
  );
  return { state, onStateChange };
}
