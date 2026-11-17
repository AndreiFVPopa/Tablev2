import { describe, expect, it } from "vitest";

import { DatasetValidationError, parseDataset } from "@shared/lib/dataset-validation";

import { studentsDataset } from "./students.dataset";
import { studentsDatasetSchema } from "./students.schema";

describe("studentsDataset", () => {
  it("exports a Zod-validated fixture dataset", () => {
    expect(studentsDataset).toHaveLength(24);
    expect(studentsDataset[0]?.enrolledAt).toBeInstanceOf(Date);
  });

  it("rejects invalid fixture payloads", () => {
    expect(() =>
      parseDataset({ schema: studentsDatasetSchema, payload: [{ id: "bad" }], entity: "elevi" }),
    ).toThrow(DatasetValidationError);
  });
});
