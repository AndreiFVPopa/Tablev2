import { useLabels } from "../labels-context";

import { directionGlyph, nextSortAction, resolveHeaderTitle } from "./sort-button.helpers";

import type { SortButtonViewModel } from "./sort-button.types";
import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { Column, RowData } from "@tanstack/react-table";

export function useSortButton<TData extends RowData>(
  column: Column<TableFeaturesConfig, TData>,
): SortButtonViewModel {
  const labels = useLabels();
  const title = resolveHeaderTitle(column);
  const direction = column.getIsSorted();
  return {
    title,
    direction,
    glyph: directionGlyph(direction),
    ariaLabel: `${labels.sortLabelPrefix} ${title}: ${nextSortAction(direction, labels)}`,
    onToggle: () => {
      column.toggleSorting();
    },
  };
}
