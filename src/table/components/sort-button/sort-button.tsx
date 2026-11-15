import { useSortButton } from "./use-sort-button";

import type { SortButtonProps } from "./sort-button.types";
import type { RowData } from "@tanstack/react-table";
export function SortButton<TData extends RowData>({
  column,
}: SortButtonProps<TData>): React.JSX.Element {
  const { title, glyph, ariaLabel, onToggle } = useSortButton(column);
  return (
    <button type="button" onClick={onToggle} aria-label={ariaLabel}>
      <span>{title}</span>
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
