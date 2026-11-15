import type { FilterComponentProps } from "../filter-component.types";
import type { NumberRangeFilterValue } from "../filter-values.types";
import type { NumericFieldDescriptor } from "@table/schema/index";
export type NumberRangeFilterProps = FilterComponentProps<
  NumericFieldDescriptor,
  NumberRangeFilterValue
>;
