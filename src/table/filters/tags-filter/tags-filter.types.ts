import type { FilterComponentProps } from "../shared/filter-component.types";
import type { TagsFilterValue } from "../shared/filter-values.types";
import type { TagsFieldDescriptor } from "@table/schema/index";
export type TagsFilterProps = FilterComponentProps<TagsFieldDescriptor, TagsFilterValue>;
