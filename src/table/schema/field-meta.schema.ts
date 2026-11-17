import { z } from "zod";

import { URL_VALUE_ENCODINGS } from "./url-value-encoding.constants";

const nonEmptyTrimmedString = z.string().trim().min(1);

export const urlValueEncodingSchema = z.enum([
  URL_VALUE_ENCODINGS.CANONICAL,
  URL_VALUE_ENCODINGS.POSITIONAL,
  URL_VALUE_ENCODINGS.SLUG,
]);

export const fieldPresentationMetaSchema = z.object({
  title: nonEmptyTrimmedString.optional(),
  description: nonEmptyTrimmedString.optional(),
  deprecated: z.boolean().optional(),
});

export const tableFieldMetaSchema = z.object({
  hidden: z.boolean().optional(),
  urlParam: nonEmptyTrimmedString.optional(),
  urlValueEncoding: urlValueEncodingSchema.optional(),
  urlSlugOverrides: z.record(z.string(), z.string().min(1)).optional(),
  optionLabels: z.record(z.string(), z.string().min(1)).optional(),
});

export type TableFieldMeta = z.infer<typeof tableFieldMetaSchema>;

declare module "zod/v4/core" {
  interface GlobalMeta {
    table?: TableFieldMeta;
  }
}
