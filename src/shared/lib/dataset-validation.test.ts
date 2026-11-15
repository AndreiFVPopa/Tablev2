import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DatasetValidationError, parseDataset } from "./dataset-validation";

const itemSchema = z.object({
  id: z.string(),
  enrolledAt: z.coerce.date(),
});

describe("parseDataset", () => {
  it("returns validated data and coerces date strings", () => {
    const data = parseDataset(
      z.array(itemSchema),
      [{ id: "a", enrolledAt: "2024-06-01" }],
      "elevi",
    );
    expect(data).toHaveLength(1);
    expect(data[0]?.id).toBe("a");
    expect(data[0]?.enrolledAt).toBeInstanceOf(Date);
  });

  it("throws DatasetValidationError with entity and issues", () => {
    expect(() => parseDataset(z.array(itemSchema), [{ id: 1 }], "elevi")).toThrow(
      DatasetValidationError,
    );
    try {
      parseDataset(z.array(itemSchema), [{ id: 1 }], "elevi");
    } catch (error) {
      expect(error).toBeInstanceOf(DatasetValidationError);
      if (error instanceof DatasetValidationError) {
        expect(error.entity).toBe("elevi");
        expect(error.issues.length).toBeGreaterThan(0);
        expect(error.message).toMatch(/elevi/);
      }
    }
  });

  it("does not silently drop invalid records", () => {
    expect(() =>
      parseDataset(
        z.array(itemSchema),
        [
          { id: "ok", enrolledAt: "2024-01-01" },
          { id: 2, enrolledAt: "2024-01-01" },
        ],
        "elevi",
      ),
    ).toThrow(DatasetValidationError);
  });
});
