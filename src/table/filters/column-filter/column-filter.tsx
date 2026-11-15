import { FIELD_KINDS } from "@table/schema/field-kinds.constants";

import { BooleanFilter } from "../boolean-filter";
import { DateRangeFilter } from "../date-range-filter";
import { EnumFilter } from "../enum-filter";
import { NumberRangeFilter } from "../number-range-filter";
import {
  parseBooleanFilterValue,
  parseDateRangeFilterValue,
  parseEnumFilterValue,
  parseNumberRangeFilterValue,
  parseTagsFilterValue,
  parseTextFilterValue,
} from "../parse-filter-value";
import { TagsFilter } from "../tags-filter";
import { TextFilter } from "../text-filter";

import type { ColumnFilterProps } from "./column-filter.types";
import type { TableFeaturesConfig } from "@table/lib/table-features";
import type { FieldDescriptor } from "@table/schema/index";
import type { Column, RowData } from "@tanstack/react-table";

export function ColumnFilter<TData extends RowData>({
  column,
}: ColumnFilterProps<TData>): React.JSX.Element | null {
  const descriptor = column.columnDef.meta?.descriptor;
  if (!descriptor) return null;
  if (!column.getCanFilter()) return null;
  return renderFilter(descriptor, column);
}

function renderFilter<TData extends RowData>(
  descriptor: FieldDescriptor,
  column: Column<TableFeaturesConfig, TData>,
): React.JSX.Element {
  const value = column.getFilterValue();
  const commit = (next: unknown): void => {
    column.setFilterValue(next);
  };

  switch (descriptor.kind) {
    case FIELD_KINDS.TEXT:
      return (
        <TextFilter descriptor={descriptor} value={parseTextFilterValue(value)} onChange={commit} />
      );
    case FIELD_KINDS.NUMERIC:
      return (
        <NumberRangeFilter
          descriptor={descriptor}
          value={parseNumberRangeFilterValue(value)}
          onChange={commit}
        />
      );
    case FIELD_KINDS.ENUM:
      return (
        <EnumFilter descriptor={descriptor} value={parseEnumFilterValue(value)} onChange={commit} />
      );
    case FIELD_KINDS.BOOLEAN:
      return (
        <BooleanFilter
          descriptor={descriptor}
          value={parseBooleanFilterValue(value)}
          onChange={commit}
        />
      );
    case FIELD_KINDS.TAGS:
      return (
        <TagsFilter descriptor={descriptor} value={parseTagsFilterValue(value)} onChange={commit} />
      );
    case FIELD_KINDS.DATE:
      return (
        <DateRangeFilter
          descriptor={descriptor}
          value={parseDateRangeFilterValue(value)}
          onChange={commit}
        />
      );
  }
}
