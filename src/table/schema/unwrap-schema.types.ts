import type { FieldWrappers } from "./descriptors";
import type { z } from "zod";

export interface UnwrapResult {
  readonly inner: z.ZodType;
  readonly wrappers: FieldWrappers;
}
