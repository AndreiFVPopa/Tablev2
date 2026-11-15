import type { FilterComponentProps } from "../filter-component.types";
import type { EnumFilterValue } from "../filter-values.types";
import type { EnumFieldDescriptor } from "@table/schema/index";
export type EnumFilterProps = FilterComponentProps<EnumFieldDescriptor, EnumFilterValue>;
