import { z } from "zod";

import { URL_VALUE_ENCODINGS } from "./url-value-encoding.constants";

export const urlValueEncodingSchema = z.enum([
  URL_VALUE_ENCODINGS.CANONICAL,
  URL_VALUE_ENCODINGS.POSITIONAL,
  URL_VALUE_ENCODINGS.SLUG,
]);

export const tableFieldMetaSchema = z.object({
  hidden: z.boolean().optional(),
  urlParam: z.string().trim().min(1).optional(),
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
