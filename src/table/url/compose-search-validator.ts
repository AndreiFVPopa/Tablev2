import { canonicaliseSearch, stripTableKeys, type SearchRecord } from "./codec";
import { resolveCodecOptions } from "./resolve-codec-options";

import type { ComposeTableSearchValidatorOptions } from "./compose-search-validator.types";
import type { z } from "zod";

export type { ComposeTableSearchValidatorOptions } from "./compose-search-validator.types";

export function composeTableSearchValidator(
  tableSchema: z.ZodType,
  options: ComposeTableSearchValidatorOptions = {},
): (search: Record<string, unknown>) => Record<string, unknown> {
  const codecOptions = resolveCodecOptions(tableSchema, options);
  const extend = options.extend;
  return (search) => {
    const safeSearch: SearchRecord = search;
    const canonicalisedTable = canonicaliseSearch(safeSearch, codecOptions);
    if (!extend) return canonicalisedTable;
    const extras = stripTableKeys(safeSearch, codecOptions);
    const extendedExtras = extend(extras);
    return { ...extendedExtras, ...canonicalisedTable };
  };
}
