import { useDataTableUrlState } from "@table/hooks/use-data-table-url-state";
import { DATA_MODES } from "@table/lib/state/data-mode.constants";
import { DEFAULT_PAGE_SIZES, resolveDefaultPageSize } from "@table/lib/state/page-sizes";

import { DataTableControlled } from "./data-table-controlled";

import type { DataTableDataSource, DataTableUrlBackedProps } from "./data-table.types";
import type { z } from "zod";

export function DataTableUrlBacked<TSchema extends z.ZodObject>(
  props: DataTableUrlBackedProps<TSchema> & DataTableDataSource,
): React.JSX.Element {
  const pageSizes = props.pageSizes ?? DEFAULT_PAGE_SIZES;
  const { state, onStateChange } = useDataTableUrlState({
    schema: props.schema,
    ...(props.urlNamespace !== undefined ? { urlNamespace: props.urlNamespace } : {}),
    pageSizes,
    defaultPageSize: resolveDefaultPageSize(pageSizes),
  });

  const server = props.dataMode === DATA_MODES.SERVER;
  return (
    <DataTableControlled
      schema={props.schema}
      data={props.data}
      state={state}
      onStateChange={onStateChange}
      {...(props.labels !== undefined ? { labels: props.labels } : {})}
      {...(props.pageSizes !== undefined ? { pageSizes: props.pageSizes } : {})}
      {...(server ? { dataMode: props.dataMode, totalRows: props.totalRows } : {})}
    />
  );
}
