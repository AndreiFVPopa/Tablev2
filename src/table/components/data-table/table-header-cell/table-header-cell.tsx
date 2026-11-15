import { FlexRender } from "@tanstack/react-table";

import { SortButton } from "@table/components/sort-button";

import { ariaSortFor } from "./aria-sort";

import type { TableHeaderCellProps } from "./table-header-cell.types";
import type { RowData } from "@tanstack/react-table";

export function TableHeaderCell<TData extends RowData>({
  header,
}: TableHeaderCellProps<TData>): React.JSX.Element {
  const sorted = header.column.getIsSorted();
  const ariaSort = ariaSortFor(sorted, header.column.getCanSort());

  return (
    <th scope="col" aria-sort={ariaSort}>
      {renderHeaderContent(header)}
    </th>
  );
}

function renderHeaderContent<TData extends RowData>(
  header: TableHeaderCellProps<TData>["header"],
): React.ReactNode {
  if (header.isPlaceholder) return null;
  if (header.column.getCanSort()) {
    return <SortButton column={header.column} />;
  }
  return <FlexRender header={header} />;
}
