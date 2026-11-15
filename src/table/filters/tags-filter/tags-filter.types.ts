import type { FilterComponentProps } from "../filter-component.types";
import type { TagsFilterValue } from "../filter-values.types";
import type { TagsFieldDescriptor } from "@table/schema/index";
export type TagsFilterProps = FilterComponentProps<TagsFieldDescriptor, TagsFilterValue>;
