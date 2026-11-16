import type { z } from "zod";

export function describeSchema(schema: z.ZodType): string {
  const constructorName = schema.constructor.name;
  return constructorName.length > 0 ? constructorName : "<unknown schema>";
}
