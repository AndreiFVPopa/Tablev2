import { ColumnFilter } from "@table/filters/column-filter";

import { TableHeaderCell } from "../table-header-cell";

import type { TableHeaderProps } from "./table-header.types";
import type { RowData } from "@tanstack/react-table";

export function TableHeader<TData extends RowData>({
  table,
}: TableHeaderProps<TData>): React.JSX.Element {
  const headerGroups = table.getHeaderGroups();
  const filterHeaders = headerGroups[0]?.headers;

  return (
    <thead>
      {headerGroups.map((group) => (
        <tr key={group.id}>
          {group.headers.map((header) => (
            <TableHeaderCell key={header.id} header={header} />
          ))}
        </tr>
      ))}
      {filterHeaders !== undefined ? (
        <tr>
          {filterHeaders.map((header) => (
            <th key={header.id} scope="col">
              <ColumnFilter column={header.column} />
            </th>
          ))}
        </tr>
      ) : null}
    </thead>
  );
}
