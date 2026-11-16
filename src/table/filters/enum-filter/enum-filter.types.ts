import type { FilterComponentProps } from "../shared/filter-component.types";
import type { EnumFilterValue } from "../shared/filter-values.types";
import type { EnumFieldDescriptor } from "@table/schema/index";
export type EnumFilterProps = FilterComponentProps<EnumFieldDescriptor, EnumFilterValue>;
