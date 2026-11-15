import { describe, it, expect } from "vitest";
import { z } from "zod";

import { DIAGNOSTIC_CODES, interpretSchema } from "../index";
describe("interpretSchema — nested objects", () => {
  it("flattens nested objects into dot-separated paths", () => {
    const schema = z.object({
      id: z.string(),
      address: z.object({
        city: z.string(),
        postalCode: z.string(),
        geo: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
      }),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    const paths = fields.map((f) => f.path).toSorted((a, b) => a.localeCompare(b));
    expect(paths).toEqual([
      "address.city",
      "address.geo.lat",
      "address.geo.lng",
      "address.postalCode",
      "id",
    ]);
    for (const field of fields) {
      expect(field.segments.join(".")).toBe(field.path);
    }
  });
  it("preserves wrappers on a nested leaf", () => {
    const schema = z.object({
      address: z.object({
        suite: z.string().optional(),
      }),
    });
    const { fields } = interpretSchema(schema);
    const suite = fields.find((f) => f.path === "address.suite");
    expect(suite?.optional).toBe(true);
    expect(suite?.kind).toBe("text");
  });
  it("walks through an optional parent object and still emits inner fields", () => {
    const schema = z.object({
      shipping: z
        .object({
          city: z.string(),
        })
        .optional(),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    expect(fields.map((f) => f.path)).toEqual(["shipping.city"]);
  });
  it("rejects schema keys that contain a literal dot", () => {
    const schema = z.object({
      "address.city": z.string(),
      normal: z.string(),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(fields.map((f) => f.path)).toEqual(["normal"]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(DIAGNOSTIC_CODES.DOTTED_KEY);
    expect(diagnostics[0]?.path).toBe("address.city");
    expect(diagnostics[0]?.message).toContain('"address.city"');
    expect(diagnostics[0]?.hint).toMatch(/rename/i);
  });
  it("flags a dotted key nested inside an object", () => {
    const schema = z.object({
      meta: z.object({
        "weird.key": z.number(),
      }),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(fields).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(DIAGNOSTIC_CODES.DOTTED_KEY);
    expect(diagnostics[0]?.path).toBe("meta.weird.key");
  });
});
