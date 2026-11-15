import { DEFAULT_PAGE_SIZES, resolveDefaultPageSize } from "../lib/page-sizes";
import { interpretSchema } from "../schema/index";

import { canonicaliseSearch, stripTableKeys, type CodecOptions, type SearchRecord } from "./codec";

import type { z } from "zod";
export interface ComposeTableSearchValidatorOptions {
  readonly urlNamespace?: string;
  readonly defaultPageSize?: number;
  readonly pageSizes?: readonly number[];
  readonly extend?: (extras: Record<string, unknown>) => Record<string, unknown>;
}
export function composeTableSearchValidator(
  tableSchema: z.ZodType,
  options: ComposeTableSearchValidatorOptions = {},
): (search: Record<string, unknown>) => Record<string, unknown> {
  const { fields } = interpretSchema(tableSchema);
  const pageSizes = options.pageSizes ?? DEFAULT_PAGE_SIZES;
  const codecOptions: CodecOptions = {
    fields,
    ...(options.urlNamespace !== undefined ? { urlNamespace: options.urlNamespace } : {}),
    defaultPageSize: options.defaultPageSize ?? resolveDefaultPageSize(pageSizes),
    pageSizes,
  };
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
