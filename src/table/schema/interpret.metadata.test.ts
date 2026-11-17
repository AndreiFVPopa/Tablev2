import { describe, it, expect } from "vitest";
import { z } from "zod";

import { interpretSchema } from "../index";
describe("interpretSchema — metadata", () => {
  it("defaults the title to the last path segment", () => {
    const { fields } = interpretSchema(
      z.object({ name: z.string(), address: z.object({ city: z.string() }) }),
    );
    expect(fields.find((f) => f.path === "name")?.meta.title).toBe("name");
    expect(fields.find((f) => f.path === "address.city")?.meta.title).toBe("city");
  });
  it("reads JSON-Schema-style metadata (title, description, deprecated)", () => {
    const schema = z.object({
      name: z.string().meta({ title: "Nume", description: "Prenumele" }),
      legacyField: z.string().meta({ deprecated: true }),
    });
    const { fields } = interpretSchema(schema);
    const name = fields.find((f) => f.path === "name");
    expect(name?.meta.title).toBe("Nume");
    expect(name?.meta.description).toBe("Prenumele");
    expect(name?.meta.deprecated).toBe(false);
    const legacy = fields.find((f) => f.path === "legacyField");
    expect(legacy?.meta.deprecated).toBe(true);
    expect(legacy?.meta.title).toBe("legacyField");
  });
  it("reads table.hidden from the augmented meta key", () => {
    const schema = z.object({
      id: z.uuid().meta({ table: { hidden: true } }),
      name: z.string(),
    });
    const { fields } = interpretSchema(schema);
    expect(fields.find((f) => f.path === "id")?.meta.hidden).toBe(true);
    expect(fields.find((f) => f.path === "name")?.meta.hidden).toBe(false);
  });
  it("sees metadata declared on the inner schema when wrapped in .optional()", () => {
    const schema = z.object({
      nickname: z.string().meta({ title: "Alias" }).optional(),
    });
    const { fields } = interpretSchema(schema);
    const nickname = fields.find((f) => f.path === "nickname");
    expect(nickname?.meta.title).toBe("Alias");
    expect(nickname?.optional).toBe(true);
  });
  it("lets a wrapper's .meta() override the inner schema's metadata", () => {
    const schema = z.object({
      field: z.string().meta({ title: "Inner" }).optional().meta({ title: "Outer" }),
    });
    const { fields } = interpretSchema(schema);
    expect(fields.find((f) => f.path === "field")?.meta.title).toBe("Outer");
  });
});
describe("interpretSchema — metadata is independent of wrapper order", () => {
  const cases: readonly {
    readonly name: string;
    readonly schema: z.ZodType;
    readonly title: string;
    readonly description: string | undefined;
    readonly hidden: boolean;
  }[] = [
    {
      name: ".meta() only (no wrapper)",
      schema: z.string().meta({ title: "T", description: "D", table: { hidden: true } }),
      title: "T",
      description: "D",
      hidden: true,
    },
    {
      name: ".meta(...).optional() — meta before optional",
      schema: z.string().meta({ title: "T", description: "D" }).optional(),
      title: "T",
      description: "D",
      hidden: false,
    },
    {
      name: ".optional().meta(...) — meta after optional",
      schema: z.string().optional().meta({ title: "T", description: "D" }),
      title: "T",
      description: "D",
      hidden: false,
    },
    {
      name: ".meta(...).nullable() — meta before nullable",
      schema: z.string().meta({ title: "T", description: "D" }).nullable(),
      title: "T",
      description: "D",
      hidden: false,
    },
    {
      name: ".nullable().meta(...) — meta after nullable",
      schema: z.string().nullable().meta({ title: "T", description: "D" }),
      title: "T",
      description: "D",
      hidden: false,
    },
    {
      name: ".meta(table.hidden).optional() — table meta before optional",
      schema: z
        .string()
        .meta({ table: { hidden: true } })
        .optional(),
      title: "field",
      description: undefined,
      hidden: true,
    },
    {
      name: ".optional().meta(table.hidden) — table meta after optional",
      schema: z
        .string()
        .optional()
        .meta({ table: { hidden: true } }),
      title: "field",
      description: undefined,
      hidden: true,
    },
    {
      name: ".meta().optional().nullable() — mixed wrappers around early meta",
      schema: z.string().meta({ title: "T" }).optional().nullable(),
      title: "T",
      description: undefined,
      hidden: false,
    },
    {
      name: ".optional().nullable().meta() — mixed wrappers before late meta",
      schema: z.string().optional().nullable().meta({ title: "T" }),
      title: "T",
      description: undefined,
      hidden: false,
    },
    {
      name: ".nullish().meta() — nullish is optional(nullable); meta still reads",
      schema: z.string().nullish().meta({ title: "T" }),
      title: "T",
      description: undefined,
      hidden: false,
    },
    {
      name: ".meta(A).optional().meta(B) — outer wins on title",
      schema: z.string().meta({ title: "Inner" }).optional().meta({ title: "Outer" }),
      title: "Outer",
      description: undefined,
      hidden: false,
    },
    {
      name: ".meta(A).nullable().meta(B) — outer wins on title",
      schema: z.string().meta({ title: "Inner" }).nullable().meta({ title: "Outer" }),
      title: "Outer",
      description: undefined,
      hidden: false,
    },
    {
      name: ".meta(hidden).optional().meta(no-table) — inner hidden survives when outer omits it",
      schema: z
        .string()
        .meta({ table: { hidden: true } })
        .optional()
        .meta({ title: "Outer" }),
      title: "Outer",
      description: undefined,
      hidden: true,
    },
    {
      name: ".meta(T).default().meta(T2) — default wrapper + outer meta wins",
      schema: z.string().meta({ title: "Inner" }).default("x").meta({ title: "Outer" }),
      title: "Outer",
      description: undefined,
      hidden: false,
    },
  ];
  it.each(cases)("$name", ({ schema, title, description, hidden }) => {
    const wrapper = z.object({ field: schema });
    const { fields, diagnostics } = interpretSchema(wrapper);
    expect(diagnostics).toEqual([]);
    const field = fields.find((f) => f.path === "field");
    expect(field).toBeDefined();
    expect(field?.meta.title).toBe(title);
    expect(field?.meta.description).toBe(description);
    expect(field?.meta.hidden).toBe(hidden);
  });
  it("gives the same resolved metadata regardless of .meta() position around .optional()", () => {
    const before = z.object({ f: z.string().meta({ title: "T" }).optional() });
    const after = z.object({ f: z.string().optional().meta({ title: "T" }) });
    const r1 = interpretSchema(before).fields[0];
    const r2 = interpretSchema(after).fields[0];
    expect(r1?.meta).toEqual(r2?.meta);
    expect(r1?.optional).toBe(true);
    expect(r2?.optional).toBe(true);
  });
  it("gives the same resolved metadata regardless of .meta() position around .nullable()", () => {
    const before = z.object({ f: z.string().meta({ title: "T" }).nullable() });
    const after = z.object({ f: z.string().nullable().meta({ title: "T" }) });
    const r1 = interpretSchema(before).fields[0];
    const r2 = interpretSchema(after).fields[0];
    expect(r1?.meta).toEqual(r2?.meta);
    expect(r1?.nullable).toBe(true);
    expect(r2?.nullable).toBe(true);
  });
});

describe("interpretSchema — invalid metadata", () => {
  it("keeps valid inner encoding when outer encoding is invalid and diagnoses the outer value", () => {
    const schema = z.object({
      gender: z
        .enum(["male", "female"])
        .meta({ table: { urlValueEncoding: "positional" } })
        .optional()
        .meta({ table: { urlValueEncoding: "nope" as "canonical" } }),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(fields[0]?.meta.urlValueEncoding).toBe("positional");
    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-field-meta",
        path: "gender",
      }),
    ]);
  });

  it("rejects an invalid table object as a whole, including a valid sibling property", () => {
    const schema = z.object({
      status: z.enum(["a", "b"]).meta({
        title: "Status",
        table: {
          hidden: true,
          optionLabels: { a: "Alpha", b: "" },
        },
      }),
      other: z.string().meta({ title: "Other" }),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    const status = fields.find((field) => field.path === "status");
    expect(status?.meta.title).toBe("Status");
    expect(status?.meta.hidden).toBe(false);
    expect(status?.meta.optionLabels).toBeUndefined();
    expect(fields.find((field) => field.path === "other")?.meta.title).toBe("Other");
    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-field-meta",
        path: "status",
      }),
    ]);
    expect(diagnostics.some((issue) => issue.path === "other")).toBe(false);
  });

  it("diagnoses invalid title, deprecated, hidden, and urlParam while keeping defaults", () => {
    const schema = z.object({
      name: z.string().meta({
        title: "  ",
        deprecated: "yes" as unknown as boolean,
        table: {
          hidden: "true" as unknown as boolean,
          urlParam: "",
        },
      }),
    });
    const { fields, diagnostics } = interpretSchema(schema);
    expect(fields[0]?.meta.title).toBe("name");
    expect(fields[0]?.meta.deprecated).toBe(false);
    expect(fields[0]?.meta.hidden).toBe(false);
    expect(fields[0]?.meta.urlParam).toBeUndefined();
    expect(diagnostics.length).toBeGreaterThanOrEqual(4);
    expect(diagnostics.every((issue) => issue.code === "invalid-field-meta")).toBe(true);
  });
});
