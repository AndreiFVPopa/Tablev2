import type { z } from "zod";

export interface ParseDatasetInput<T> {
  readonly schema: z.ZodType<T>;
  readonly payload: unknown;
  readonly entity: string;
}
