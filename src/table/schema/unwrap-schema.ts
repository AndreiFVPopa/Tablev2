import { z } from "zod";

import { MAX_SCHEMA_WRAPPER_DEPTH } from "./wrapper-depth.constants";

import type { UnwrapResult } from "./unwrap-schema.types";
import type * as zCore from "zod/v4/core";

export type { UnwrapResult } from "./unwrap-schema.types";

export function unwrapSchema(schema: z.ZodType): UnwrapResult {
  let current: z.ZodType = schema;
  let optional = false;
  let nullable = false;
  let hasDefault = false;
  let isReadonly = false;
  for (let depth = 0; depth < MAX_SCHEMA_WRAPPER_DEPTH; depth += 1) {
    if (current instanceof z.ZodOptional) {
      optional = true;
      current = asZodType(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodNullable) {
      nullable = true;
      current = asZodType(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodDefault) {
      hasDefault = true;
      current = asZodType(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodReadonly) {
      isReadonly = true;
      current = asZodType(current.unwrap());
      continue;
    }
    break;
  }
  return {
    inner: current,
    wrappers: { optional, nullable, hasDefault, readonly: isReadonly },
  };
}

export function tryUnwrap(schema: z.ZodType): z.ZodType | undefined {
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault ||
    schema instanceof z.ZodReadonly
  ) {
    return asZodType(schema.unwrap());
  }
  return undefined;
}

function asZodType(schema: zCore.SomeType): z.ZodType {
  return schema as z.ZodType;
}
