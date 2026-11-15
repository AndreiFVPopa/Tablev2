import {
  booleanFilterValueSchema,
  dateRangeFilterValueSchema,
  enumFilterValueSchema,
  numberRangeFilterValueSchema,
  tagsFilterValueSchema,
  textFilterValueSchema,
} from "./filter-values.schema";

import type {
  BooleanFilterValue,
  DateRangeFilterValue,
  EnumFilterValue,
  NumberRangeFilterValue,
  TagsFilterValue,
  TextFilterValue,
} from "./filter-values.types";
import type { z } from "zod";

export function parseFilterValue<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

export function parseTextFilterValue(value: unknown): TextFilterValue | undefined {
  return parseFilterValue(textFilterValueSchema, value);
}

export function parseNumberRangeFilterValue(value: unknown): NumberRangeFilterValue | undefined {
  return parseFilterValue(numberRangeFilterValueSchema, value);
}

export function parseEnumFilterValue(value: unknown): EnumFilterValue | undefined {
  return parseFilterValue(enumFilterValueSchema, value);
}

export function parseBooleanFilterValue(value: unknown): BooleanFilterValue | undefined {
  return parseFilterValue(booleanFilterValueSchema, value);
}

export function parseTagsFilterValue(value: unknown): TagsFilterValue | undefined {
  return parseFilterValue(tagsFilterValueSchema, value);
}

export function parseDateRangeFilterValue(value: unknown): DateRangeFilterValue | undefined {
  return parseFilterValue(dateRangeFilterValueSchema, value);
}
