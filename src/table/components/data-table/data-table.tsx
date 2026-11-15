import { DataTableControlled } from "./data-table-controlled";
import { DataTableUrlBacked } from "./data-table-url-backed";
import { isControlledDataTableProps } from "./data-table.types";

import type { DataTableProps } from "./data-table.types";
import type { RowData } from "@tanstack/react-table";

export { DEFAULT_PAGE_SIZES } from "@table/lib/page-sizes";

export type { DataTableProps } from "./data-table.types";

export function DataTable<TData extends RowData>(props: DataTableProps<TData>): React.JSX.Element {
  if (isControlledDataTableProps(props)) {
    return <DataTableControlled {...props} />;
  }
  return <DataTableUrlBacked {...props} />;
}
