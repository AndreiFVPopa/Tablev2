import type { FilterComponentProps } from "../filter-component.types";
import type { DateRangeFilterValue } from "../filter-values.types";
import type { DateFieldDescriptor } from "@table/schema/index";
export type DateRangeFilterProps = FilterComponentProps<DateFieldDescriptor, DateRangeFilterValue>;
