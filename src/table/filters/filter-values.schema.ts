import { z } from "zod";

export const textFilterValueSchema = z.string();

export const enumFilterValueSchema = z.union([z.string(), z.null()]);

export const booleanFilterValueSchema = z.union([z.boolean(), z.null()]);

export const tagsFilterValueSchema = z.array(z.string()).readonly();

const softFiniteNumber = z.union([z.number(), z.unknown().transform(() => undefined)]).optional();

export const numberRangeFilterValueSchema = z
  .object({
    min: softFiniteNumber,
    max: softFiniteNumber,
  })
  .transform((value) => {
    const next = {
      ...(value.min !== undefined ? { min: value.min } : {}),
      ...(value.max !== undefined ? { max: value.max } : {}),
    };
    return Object.keys(next).length > 0 ? next : undefined;
  });

const softIsoDate = z.union([z.iso.date(), z.unknown().transform(() => undefined)]).optional();

export const dateRangeFilterValueSchema = z
  .object({
    from: softIsoDate,
    to: softIsoDate,
  })
  .transform((value) => {
    const next = {
      ...(value.from !== undefined ? { from: value.from } : {}),
      ...(value.to !== undefined ? { to: value.to } : {}),
    };
    return Object.keys(next).length > 0 ? next : undefined;
  });

export const columnFilterValueSchema = z.union([
  textFilterValueSchema,
  numberRangeFilterValueSchema,
  enumFilterValueSchema,
  booleanFilterValueSchema,
  tagsFilterValueSchema,
  dateRangeFilterValueSchema,
]);
