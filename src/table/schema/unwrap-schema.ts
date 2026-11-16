import { z } from "zod";

import { toClassicZodType } from "./to-classic-zod-type";
import { MAX_SCHEMA_WRAPPER_DEPTH } from "./wrapper-depth.constants";

import type { FieldWrappers } from "./descriptors";

export interface UnwrapResult {
  readonly inner: z.ZodType;
  readonly wrappers: FieldWrappers;
}

export function unwrapSchema(schema: z.ZodType): UnwrapResult {
  let current: z.ZodType = schema;
  let optional = false;
  let nullable = false;
  let hasDefault = false;
  let isReadonly = false;
  for (let depth = 0; depth < MAX_SCHEMA_WRAPPER_DEPTH; depth += 1) {
    if (current instanceof z.ZodOptional) {
      optional = true;
      current = toClassicZodType(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodNullable) {
      nullable = true;
      current = toClassicZodType(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodDefault) {
      hasDefault = true;
      current = toClassicZodType(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodReadonly) {
      isReadonly = true;
      current = toClassicZodType(current.unwrap());
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
    return toClassicZodType(schema.unwrap());
  }
  return undefined;
}
