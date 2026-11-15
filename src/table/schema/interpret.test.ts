import { describe, it, expect } from "vitest";
import { z } from "zod";

import {
  FIELD_KINDS,
  defaultFilterKind,
  interpretSchema,
  isSortableKind,
  type FieldDescriptor,
} from "../index";
function byPath(fields: readonly FieldDescriptor[], path: string): FieldDescriptor {
  const found = fields.find((f) => f.path === path);
  if (!found)
    throw new Error(`No field at path "${path}"; got ${fields.map((f) => f.path).join(", ")}`);
  return found;
}
describe("interpretSchema — core kinds", () => {
  it("interprets string as text with min/max length and format", () => {
    const schema = z.object({
      name: z.string().min(2).max(40),
      email: z.email(),
      id: z.uuid(),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    expect(fields).toHaveLength(3);
    const name = byPath(fields, "name");
    expect(name.kind).toBe(FIELD_KINDS.TEXT);
    if (name.kind === FIELD_KINDS.TEXT) {
      expect(name.minLength).toBe(2);
      expect(name.maxLength).toBe(40);
      expect(name.format).toBeUndefined();
    }
    const email = byPath(fields, "email");
    if (email.kind === FIELD_KINDS.TEXT) expect(email.format).toBe("email");
    const id = byPath(fields, "id");
    if (id.kind === FIELD_KINDS.TEXT) expect(id.format).toBe("uuid");
  });
  it("interprets number as numeric with min, max, and integer flag", () => {
    const schema = z.object({
      age: z.number().int().min(5).max(25),
      ratio: z.number(),
      bigness: z.int32(),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    const age = byPath(fields, "age");
    expect(age.kind).toBe(FIELD_KINDS.NUMERIC);
    if (age.kind === FIELD_KINDS.NUMERIC) {
      expect(age.min).toBe(5);
      expect(age.max).toBe(25);
      expect(age.integer).toBe(true);
      expect(age.format).toBe("safeint");
    }
    const ratio = byPath(fields, "ratio");
    if (ratio.kind === FIELD_KINDS.NUMERIC) {
      expect(ratio.integer).toBe(false);
      expect(ratio.format).toBeUndefined();
    }
    const bigness = byPath(fields, "bigness");
    if (bigness.kind === FIELD_KINDS.NUMERIC) {
      expect(bigness.integer).toBe(true);
      expect(bigness.format).toBe("int32");
    }
  });
  it("interprets boolean", () => {
    const { fields, diagnostics } = interpretSchema(z.object({ active: z.boolean() }));
    expect(diagnostics).toEqual([]);
    expect(byPath(fields, "active").kind).toBe(FIELD_KINDS.BOOLEAN);
  });
  it("interprets a plain z.date() as a date descriptor", () => {
    const { fields, diagnostics } = interpretSchema(
      z.object({ createdAt: z.date(), updatedAt: z.date() }),
    );
    expect(diagnostics).toEqual([]);
    expect(byPath(fields, "createdAt").kind).toBe(FIELD_KINDS.DATE);
    expect(byPath(fields, "updatedAt").kind).toBe(FIELD_KINDS.DATE);
  });
  it("interprets z.date().min/max as a date descriptor but omits bounds (see DateFieldDescriptor note)", () => {
    const start = new Date("2020-01-01");
    const end = new Date("2030-01-01");
    const schema = z.object({
      bounded: z.date().min(start).max(end),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    const bounded = byPath(fields, "bounded");
    expect(bounded.kind).toBe(FIELD_KINDS.DATE);
    expect(Object.prototype.hasOwnProperty.call(bounded, "min")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(bounded, "max")).toBe(false);
  });
  it("interprets string enum with options", () => {
    const schema = z.object({ color: z.enum(["red", "green", "blue"]) });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    const color = byPath(fields, "color");
    expect(color.kind).toBe(FIELD_KINDS.ENUM);
    if (color.kind === FIELD_KINDS.ENUM) {
      expect(color.options).toEqual(["red", "green", "blue"]);
    }
  });
  it("interprets array of enum as tags", () => {
    const schema = z.object({ tags: z.array(z.enum(["alpha", "beta"])) });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    const tags = byPath(fields, "tags");
    expect(tags.kind).toBe(FIELD_KINDS.TAGS);
    if (tags.kind === FIELD_KINDS.TAGS) {
      expect(tags.options).toEqual(["alpha", "beta"]);
    }
  });
});
describe("interpretSchema — wrappers", () => {
  it("records optional, nullable, hasDefault, readonly without changing the kind", () => {
    const schema = z.object({
      maybeName: z.string().optional(),
      nullableScore: z.number().nullable(),
      status: z.enum(["on", "off"]).default("on"),
      frozen: z.string().readonly(),
      nullish: z.string().nullish(),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(diagnostics).toEqual([]);
    const maybe = byPath(fields, "maybeName");
    expect(maybe.optional).toBe(true);
    expect(maybe.nullable).toBe(false);
    expect(maybe.kind).toBe(FIELD_KINDS.TEXT);
    const nullable = byPath(fields, "nullableScore");
    expect(nullable.nullable).toBe(true);
    expect(nullable.optional).toBe(false);
    const status = byPath(fields, "status");
    expect(status.hasDefault).toBe(true);
    expect(status.kind).toBe(FIELD_KINDS.ENUM);
    const frozen = byPath(fields, "frozen");
    expect(frozen.readonly).toBe(true);
    const nullish = byPath(fields, "nullish");
    expect(nullish.optional).toBe(true);
    expect(nullish.nullable).toBe(true);
  });
});
describe("capability helpers", () => {
  it("isSortableKind matches the specified ordering", () => {
    expect(isSortableKind("text")).toBe(true);
    expect(isSortableKind("numeric")).toBe(true);
    expect(isSortableKind("date")).toBe(true);
    expect(isSortableKind("boolean")).toBe(true);
    expect(isSortableKind("enum")).toBe(true);
    expect(isSortableKind("tags")).toBe(false);
  });
  it("defaultFilterKind maps each kind to a documented family", () => {
    expect(defaultFilterKind("text")).toBe("text-search");
    expect(defaultFilterKind("numeric")).toBe("number-range");
    expect(defaultFilterKind("boolean")).toBe("boolean-tri");
    expect(defaultFilterKind("enum")).toBe("enum-select");
    expect(defaultFilterKind("date")).toBe("date-range");
    expect(defaultFilterKind("tags")).toBe("tags-multiselect");
  });
});
