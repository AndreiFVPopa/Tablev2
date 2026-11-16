import { DEFAULT_PAGE_SIZES, resolveDefaultPageSize } from "../lib/page-sizes";
import { interpretSchema } from "../schema/index";

import { buildTableSearchKeySet } from "./search-keys";

import type { CodecOptions } from "./codec.types";
import type { ComposeTableSearchValidatorOptions } from "./compose-search-validator.types";
import type { FieldDescriptor } from "@table/schema/descriptors";
import type { z } from "zod";

export function createCodecOptions(input: {
  readonly fields: readonly FieldDescriptor[];
  readonly urlNamespace?: string;
  readonly defaultPageSize: number;
  readonly pageSizes: readonly number[];
}): CodecOptions {
  return {
    fields: input.fields,
    ...(input.urlNamespace !== undefined ? { urlNamespace: input.urlNamespace } : {}),
    defaultPageSize: input.defaultPageSize,
    pageSizes: input.pageSizes,
    tableSearchKeySet: buildTableSearchKeySet(input),
  };
}

export function resolveCodecOptions(
  tableSchema: z.ZodType,
  options: ComposeTableSearchValidatorOptions = {},
): CodecOptions {
  const { fields } = interpretSchema(tableSchema);
  const pageSizes = options.pageSizes ?? DEFAULT_PAGE_SIZES;
  return createCodecOptions({
    fields,
    ...(options.urlNamespace !== undefined ? { urlNamespace: options.urlNamespace } : {}),
    defaultPageSize: options.defaultPageSize ?? resolveDefaultPageSize(pageSizes),
    pageSizes,
  });
}
