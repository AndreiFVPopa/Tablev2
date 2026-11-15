import type { FilterComponentProps } from "../filter-component.types";
import type { BooleanFilterValue } from "../filter-values.types";
import type { BooleanFieldDescriptor } from "@table/schema/index";
export type BooleanFilterProps = FilterComponentProps<BooleanFieldDescriptor, BooleanFilterValue>;
export type BooleanFilterChoice = "all" | "true" | "false";
