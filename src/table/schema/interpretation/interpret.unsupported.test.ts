import { describe, it, expect } from "vitest";
import { z } from "zod";

import { DIAGNOSTIC_CODES, interpretSchema, SchemaInterpretationError } from "../../index";
describe("interpretSchema — diagnostics", () => {
  it("reports root-not-object when the schema root is not a z.object", () => {
    const { fields, diagnostics } = interpretSchema(z.string());
    expect(fields).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(DIAGNOSTIC_CODES.ROOT_NOT_OBJECT);
    expect(diagnostics[0]?.path).toBe("");
    expect(diagnostics[0]?.message).toContain("z.object(...)");
    expect(diagnostics[0]?.message).toContain("ZodString");
  });
  it("unwraps an optional root object before deciding root-not-object", () => {
    const schema = z.object({ name: z.string() }).optional();
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    expect(fields.map((f) => f.path)).toEqual(["name"]);
  });
  it("reports unsupported-schema for z.bigint, z.map, z.set, z.record, z.union, z.tuple, z.literal, z.any, z.unknown", () => {
    const schema = z.object({
      big: z.bigint(),
      map: z.map(z.string(), z.number()),
      set: z.set(z.string()),
      record: z.record(z.string(), z.number()),
      union: z.union([z.string(), z.number()]),
      tuple: z.tuple([z.string(), z.number()]),
      literal: z.literal("x"),
      anything: z.any(),
      whatever: z.unknown(),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(fields).toEqual([]);
    expect(diagnostics).toHaveLength(9);
    for (const d of diagnostics) {
      expect(d.code).toBe(DIAGNOSTIC_CODES.UNSUPPORTED_SCHEMA);
    }
    const paths = diagnostics.map((d) => d.path).toSorted((a, b) => a.localeCompare(b));
    expect(paths).toEqual([
      "anything",
      "big",
      "literal",
      "map",
      "record",
      "set",
      "tuple",
      "union",
      "whatever",
    ]);
  });
  it("reports non-enum-array for an array of non-enum elements", () => {
    const schema = z.object({
      numbers: z.array(z.number()),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(fields).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(DIAGNOSTIC_CODES.NON_ENUM_ARRAY);
    expect(diagnostics[0]?.path).toBe("numbers");
    expect(diagnostics[0]?.message).toContain("ZodNumber");
  });
  it("reports empty-enum for z.enum([])-like values", () => {
    const empty = z.enum([] as unknown as readonly ["a"]);
    const { fields, diagnostics } = interpretSchema(z.object({ never: empty }));
    expect(fields).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(DIAGNOSTIC_CODES.EMPTY_ENUM);
  });
  it("reports non-string-enum for enums with numeric values", () => {
    enum Priority {
      Low = 1,
      High = 2,
    }
    const schema = z.object({ priority: z.enum(Priority) });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(fields).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(DIAGNOSTIC_CODES.NON_STRING_ENUM);
    expect(diagnostics[0]?.path).toBe("priority");
  });
  it("throws SchemaInterpretationError when throwOnDiagnostics is true", () => {
    const schema = z.object({ bad: z.map(z.string(), z.string()) });
    expect(() => interpretSchema(schema, { throwOnDiagnostics: true })).toThrow(
      SchemaInterpretationError,
    );
    try {
      interpretSchema(schema, { throwOnDiagnostics: true });
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaInterpretationError);
      if (error instanceof SchemaInterpretationError) {
        expect(error.diagnostics).toHaveLength(1);
        expect(error.diagnostics[0]?.code).toBe(DIAGNOSTIC_CODES.UNSUPPORTED_SCHEMA);
        expect(error.message).toContain(DIAGNOSTIC_CODES.UNSUPPORTED_SCHEMA);
      }
    }
  });
});
