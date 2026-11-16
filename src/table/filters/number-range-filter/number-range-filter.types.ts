import type { FilterComponentProps } from "../shared/filter-component.types";
import type { NumberRangeFilterValue } from "../shared/filter-values.types";
import type { NumericFieldDescriptor } from "@table/schema/index";
export type NumberRangeFilterProps = FilterComponentProps<
  NumericFieldDescriptor,
  NumberRangeFilterValue
>;
