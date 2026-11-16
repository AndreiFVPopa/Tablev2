import { DEFAULT_PAGE_SIZES, resolveDefaultPageSize } from "../lib/page-sizes";
import { interpretSchema } from "../schema/index";

import type { CodecOptions } from "./codec";
import type { ComposeTableSearchValidatorOptions } from "./compose-search-validator.types";
import type { z } from "zod";

export function resolveCodecOptions(
  tableSchema: z.ZodType,
  options: ComposeTableSearchValidatorOptions = {},
): CodecOptions {
  const { fields } = interpretSchema(tableSchema);
  const pageSizes = options.pageSizes ?? DEFAULT_PAGE_SIZES;
  return {
    fields,
    ...(options.urlNamespace !== undefined ? { urlNamespace: options.urlNamespace } : {}),
    defaultPageSize: options.defaultPageSize ?? resolveDefaultPageSize(pageSizes),
    pageSizes,
  };
}
