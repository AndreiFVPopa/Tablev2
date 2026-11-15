import { useDataTableUrlState } from "@table/hooks/use-data-table-url-state";
import { DEFAULT_PAGE_SIZES, resolveDefaultPageSize } from "@table/lib/page-sizes";

import { DataTableControlled } from "./data-table-controlled";

import type { DataTableUrlBackedProps } from "./data-table.types";
import type { RowData } from "@tanstack/react-table";

export function DataTableUrlBacked<TData extends RowData>(
  props: DataTableUrlBackedProps<TData>,
): React.JSX.Element {
  const pageSizes = props.pageSizes ?? DEFAULT_PAGE_SIZES;
  const { state, onStateChange } = useDataTableUrlState({
    schema: props.schema,
    ...(props.urlNamespace !== undefined ? { urlNamespace: props.urlNamespace } : {}),
    pageSizes,
    defaultPageSize: resolveDefaultPageSize(pageSizes),
  });

  return (
    <DataTableControlled
      schema={props.schema}
      data={props.data}
      state={state}
      onStateChange={onStateChange}
      {...(props.labels !== undefined ? { labels: props.labels } : {})}
      {...(props.pageSizes !== undefined ? { pageSizes: props.pageSizes } : {})}
    />
  );
}
