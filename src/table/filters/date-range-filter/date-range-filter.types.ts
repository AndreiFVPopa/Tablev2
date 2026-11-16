import type { FilterComponentProps } from "../shared/filter-component.types";
import type { DateRangeFilterValue } from "../shared/filter-values.types";
import type { DateFieldDescriptor } from "@table/schema/index";
export type DateRangeFilterProps = FilterComponentProps<DateFieldDescriptor, DateRangeFilterValue>;
