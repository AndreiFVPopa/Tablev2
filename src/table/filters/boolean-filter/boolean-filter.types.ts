import type { FilterComponentProps } from "../shared/filter-component.types";
import type { BooleanFilterValue } from "../shared/filter-values.types";
import type { BooleanFieldDescriptor } from "@table/schema/index";

export type BooleanFilterProps = FilterComponentProps<BooleanFieldDescriptor, BooleanFilterValue>;
