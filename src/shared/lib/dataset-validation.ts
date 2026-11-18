import type { ParseDatasetInput } from "./dataset-validation.types";
import type { z } from "zod";

export class DatasetValidationError extends Error {
  readonly entity: string;
  readonly issues: z.ZodError["issues"];

  constructor(entity: string, error: z.ZodError) {
    super(`Setul de date „${entity}” este invalid (${String(error.issues.length)} probleme).`);
    this.name = "DatasetValidationError";
    this.entity = entity;
    this.issues = error.issues;
  }
}

export function parseDataset<T>({ schema, payload, entity }: ParseDatasetInput<T>): T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new DatasetValidationError(entity, result.error);
  }
  return result.data;
}
