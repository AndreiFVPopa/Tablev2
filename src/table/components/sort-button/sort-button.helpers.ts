import { SORT_DIRECTION } from "./sort-direction.constants";

import type { ColumnSortState } from "./sort-button.types";
import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { FieldDescriptor } from "@table/schema/index";
import type { TableLabels } from "@table/table-labels";
import type { Column, RowData } from "@tanstack/react-table";

export function resolveHeaderTitle<TData extends RowData>(
  column: Column<TableFeaturesConfig, TData>,
): string {
  const descriptor: FieldDescriptor | undefined = column.columnDef.meta?.descriptor;
  return descriptor?.meta.title ?? column.id;
}

export function directionGlyph(direction: ColumnSortState): string {
  if (direction === SORT_DIRECTION.ASCENDING) return " ▲";
  if (direction === SORT_DIRECTION.DESCENDING) return " ▼";
  return " ↕";
}

export function nextSortAction(
  direction: ColumnSortState,
  labels: Pick<TableLabels, "sortAscending" | "sortDescending" | "sortClear">,
): string {
  if (direction === false) return labels.sortAscending;
  if (direction === SORT_DIRECTION.ASCENDING) return labels.sortDescending;
  return labels.sortClear;
}
