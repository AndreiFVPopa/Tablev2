import { describe, expect, it } from "vitest";
import { z } from "zod";

import { FIELD_KINDS, interpretSchema } from "../../index";

describe("cascading schema change: age: number → age: string", () => {
  it("interprets age as numeric when defined as z.number()", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().int().min(5).max(25),
    });
    const { fields } = interpretSchema(schema);
    const age = fields.find((f) => f.path === "age");
    expect(age?.kind).toBe(FIELD_KINDS.NUMERIC);
    if (age?.kind === FIELD_KINDS.NUMERIC) {
      expect(age.integer).toBe(true);
      expect(age.min).toBe(5);
      expect(age.max).toBe(25);
    }
  });

  it("interprets age as text when defined as z.string()", () => {
    const schema = z.object({
      name: z.string(),
      age: z.string().min(1).max(3),
    });
    const { fields } = interpretSchema(schema);
    const age = fields.find((f) => f.path === "age");
    expect(age?.kind).toBe(FIELD_KINDS.TEXT);
    if (age?.kind === FIELD_KINDS.TEXT) {
      expect(age.minLength).toBe(1);
      expect(age.maxLength).toBe(3);
    }
  });

  it("still interprets age as enum when switched to an enum", () => {
    const schema = z.object({
      age: z.enum(["child", "teen", "adult"]),
    });
    const { fields } = interpretSchema(schema);
    const age = fields.find((f) => f.path === "age");
    expect(age?.kind).toBe(FIELD_KINDS.ENUM);
    if (age?.kind === FIELD_KINDS.ENUM) {
      expect(age.options).toEqual(["child", "teen", "adult"]);
    }
  });
});
