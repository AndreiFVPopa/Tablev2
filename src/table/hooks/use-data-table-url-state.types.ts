import type { DataTableState } from "../lib/state/table-state";
import type { z } from "zod";

export interface UseDataTableUrlStateOptions {
  readonly schema: z.ZodType;
  readonly urlNamespace?: string;
  readonly pageSizes: readonly number[];
  readonly defaultPageSize: number;
}

export interface UseDataTableUrlStateResult {
  readonly state: DataTableState;
  readonly onStateChange: (nextState: DataTableState) => void;
}
