import { flexRender } from "@tanstack/react-table";

import styles from "../data-table.module.scss";

import type { TableBodyProps } from "./table-body.types";
import type { RowData } from "@tanstack/react-table";

export function TableBody<TData extends RowData>({
  table,
  columnCount,
  emptyLabel,
}: TableBodyProps<TData>): React.JSX.Element {
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columnCount} className={styles.empty}>
            {emptyLabel}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {rows.map((row) => (
        <tr key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
