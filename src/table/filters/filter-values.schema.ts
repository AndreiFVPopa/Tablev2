import { z } from "zod";

import { DATE_RANGE_BOUNDARY } from "./date-range-filter/date-range-boundary.constants";
import { NUMBER_RANGE_BOUNDARY } from "./number-range-filter/number-range-boundary.constants";

export const textFilterValueSchema = z.string();

export const enumFilterValueSchema = z.union([z.string(), z.null()]);

export const booleanFilterValueSchema = z.union([z.boolean(), z.null()]);

export const tagsFilterValueSchema = z.array(z.string()).readonly();

const softFiniteNumber = z.union([z.number(), z.unknown().transform(() => undefined)]).optional();

export const numberRangeFilterValueSchema = z
  .object({
    [NUMBER_RANGE_BOUNDARY.MINIMUM]: softFiniteNumber,
    [NUMBER_RANGE_BOUNDARY.MAXIMUM]: softFiniteNumber,
  })
  .transform((value) => {
    const updatedRange = {
      ...(value.min !== undefined ? { min: value.min } : {}),
      ...(value.max !== undefined ? { max: value.max } : {}),
    };
    return Object.keys(updatedRange).length > 0 ? updatedRange : undefined;
  });

const softIsoDate = z.union([z.iso.date(), z.unknown().transform(() => undefined)]).optional();

export const dateRangeFilterValueSchema = z
  .object({
    [DATE_RANGE_BOUNDARY.FROM]: softIsoDate,
    [DATE_RANGE_BOUNDARY.TO]: softIsoDate,
  })
  .transform((value) => {
    const updatedRange = {
      ...(value.from !== undefined ? { from: value.from } : {}),
      ...(value.to !== undefined ? { to: value.to } : {}),
    };
    return Object.keys(updatedRange).length > 0 ? updatedRange : undefined;
  });

export const columnFilterValueSchema = z.union([
  textFilterValueSchema,
  numberRangeFilterValueSchema,
  enumFilterValueSchema,
  booleanFilterValueSchema,
  tagsFilterValueSchema,
  dateRangeFilterValueSchema,
]);
