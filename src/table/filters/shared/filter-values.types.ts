import type {
  booleanFilterValueSchema,
  columnFilterValueSchema,
  dateRangeFilterValueSchema,
  enumFilterValueSchema,
  numberRangeFilterValueSchema,
  tagsFilterValueSchema,
  textFilterValueSchema,
} from "./filter-values.schema";
import type { z } from "zod";

export type TextFilterValue = z.infer<typeof textFilterValueSchema>;

export type NumberRangeFilterValue = Exclude<
  z.output<typeof numberRangeFilterValueSchema>,
  undefined
>;

export type EnumFilterValue = z.infer<typeof enumFilterValueSchema>;

export type BooleanFilterValue = z.infer<typeof booleanFilterValueSchema>;

export type TagsFilterValue = z.infer<typeof tagsFilterValueSchema>;

export type DateRangeFilterValue = Exclude<z.output<typeof dateRangeFilterValueSchema>, undefined>;

export type ColumnFilterValue = Exclude<z.output<typeof columnFilterValueSchema>, undefined>;
