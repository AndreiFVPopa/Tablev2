import type { z } from "zod";
import type * as zCore from "zod/v4/core";

export function toClassicZodType(schema: zCore.SomeType): z.ZodType {
  return schema as z.ZodType;
}
