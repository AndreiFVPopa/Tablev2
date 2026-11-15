import { describe, expect, it } from "vitest";

import { loadStudentsFixture } from "@mocks/students/load-students-fixture";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";
import { interpretSchema } from "@table/schema/interpret";

import { studentSchema, studentsDatasetSchema } from "./students.schema";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asRecordArray(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) throw new Error("expected array fixture");
  const rows: Record<string, unknown>[] = [];
  for (const row of raw) {
    if (!isPlainRecord(row)) throw new Error("expected object row");
    rows.push({ ...row });
  }
  return rows;
}

describe("studentSchema", () => {
  it("validates the fixture and coerces enrolledAt to Date", () => {
    const result = studentsDatasetSchema.safeParse(loadStudentsFixture());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(24);
    expect(result.data[0]?.enrolledAt).toBeInstanceOf(Date);
    expect(result.data.some((row) => row.gpa === null)).toBe(true);
    expect(result.data.some((row) => row.notes === null || row.notes === undefined)).toBe(true);
  });

  it("rejects invalid records instead of dropping them", () => {
    const rows = asRecordArray(loadStudentsFixture());
    const first = rows[0];
    if (first === undefined) throw new Error("expected at least one row");
    const invalid = [{ ...first, age: 99 }, ...rows.slice(1)];
    const result = studentsDatasetSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("is compatible with the Phase 2 interpreter", () => {
    const { fields, diagnostics } = interpretSchema(studentSchema);
    expect(diagnostics).toEqual([]);
    const byPath = Object.fromEntries(fields.map((field) => [field.path, field.kind]));
    expect(byPath.id).toBe(FIELD_KINDS.TEXT);
    expect(byPath.name).toBe(FIELD_KINDS.TEXT);
    expect(byPath.email).toBe(FIELD_KINDS.TEXT);
    expect(byPath.age).toBe(FIELD_KINDS.NUMERIC);
    expect(byPath.grade).toBe(FIELD_KINDS.ENUM);
    expect(byPath.active).toBe(FIELD_KINDS.BOOLEAN);
    expect(byPath.enrolledAt).toBe(FIELD_KINDS.DATE);
    expect(byPath.gpa).toBe(FIELD_KINDS.NUMERIC);
    expect(byPath.tags).toBe(FIELD_KINDS.TAGS);
    expect(byPath["address.city"]).toBe(FIELD_KINDS.TEXT);
    expect(byPath["address.county"]).toBe(FIELD_KINDS.TEXT);
    expect(byPath.notes).toBe(FIELD_KINDS.TEXT);
  });

  it("exposes Romanian titles via metadata", () => {
    const { fields } = interpretSchema(studentSchema);
    const titles = Object.fromEntries(fields.map((field) => [field.path, field.meta.title]));
    expect(titles.name).toBe("Nume");
    expect(titles.enrolledAt).toBe("Înscris");
    expect(titles["address.city"]).toBe("Oraș");
  });
});
