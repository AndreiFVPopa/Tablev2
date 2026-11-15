import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  DIAGNOSTIC_CODES,
  FIELD_KINDS,
  FILTER_KINDS,
  defaultFilterKind,
  interpretSchema,
  isSortableKind,
  SchemaInterpretationError,
  type BooleanFieldDescriptor,
  type DateFieldDescriptor,
  type DiagnosticCode,
  type DiagnosticIssue,
  type EnumFieldDescriptor,
  type FieldDescriptor,
  type FieldKind,
  type FieldWrappers,
  type FilterKind,
  type InterpretationResult,
  type InterpretOptions,
  type NumericFieldDescriptor,
  type ResolvedFieldMeta,
  type TableFieldMeta,
  type TagsFieldDescriptor,
  type TextFieldDescriptor,
} from "../index";
describe("schema interpreter — public API surface", () => {
  it("exports runtime values with their documented shapes", () => {
    expect(typeof interpretSchema).toBe("function");
    expect(typeof isSortableKind).toBe("function");
    expect(typeof defaultFilterKind).toBe("function");
    expect(typeof SchemaInterpretationError).toBe("function");
    expect(FIELD_KINDS.TEXT).toBe("text");
    expect(FILTER_KINDS.TEXT_SEARCH).toBe("text-search");
    expect(DIAGNOSTIC_CODES.ROOT_NOT_OBJECT).toBe("root-not-object");
    const err = new SchemaInterpretationError([
      { code: DIAGNOSTIC_CODES.ROOT_NOT_OBJECT, path: "", message: "sample", hint: "fix it" },
    ]);
    expect(err).toBeInstanceOf(SchemaInterpretationError);
    expect(err.diagnostics).toHaveLength(1);
  });
  it("exposes FieldKind values that round-trip through the capability helpers", () => {
    const kinds: FieldKind[] = Object.values(FIELD_KINDS);
    expect(kinds).toHaveLength(6);
    for (const kind of kinds) {
      const filter: FilterKind = defaultFilterKind(kind);
      expect(Object.values(FILTER_KINDS)).toContain(filter);
      expect(typeof isSortableKind(kind)).toBe("boolean");
    }
  });
  it("returns a typed InterpretationResult with options honoring InterpretOptions", () => {
    const options: InterpretOptions = { throwOnDiagnostics: false };
    const result: InterpretationResult = interpretSchema(z.object({ name: z.string() }), options);
    expect(result.fields).toHaveLength(1);
    expect(result.diagnostics).toEqual([]);
  });
  it("narrows FieldDescriptor to each of the documented variants", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      active: z.boolean(),
      status: z.enum(["on", "off"]),
      created: z.date(),
      tags: z.array(z.enum(["a", "b"])),
    });
    const { fields } = interpretSchema(schema);
    const byKind = new Map<FieldKind, FieldDescriptor>(fields.map((f) => [f.kind, f] as const));
    const text = byKind.get(FIELD_KINDS.TEXT) as TextFieldDescriptor;
    const numeric = byKind.get(FIELD_KINDS.NUMERIC) as NumericFieldDescriptor;
    const bool = byKind.get(FIELD_KINDS.BOOLEAN) as BooleanFieldDescriptor;
    const enumD = byKind.get(FIELD_KINDS.ENUM) as EnumFieldDescriptor;
    const date = byKind.get(FIELD_KINDS.DATE) as DateFieldDescriptor;
    const tags = byKind.get(FIELD_KINDS.TAGS) as TagsFieldDescriptor;
    expect(text.kind).toBe(FIELD_KINDS.TEXT);
    expect(numeric.kind).toBe(FIELD_KINDS.NUMERIC);
    expect(bool.kind).toBe(FIELD_KINDS.BOOLEAN);
    expect(enumD.kind).toBe(FIELD_KINDS.ENUM);
    expect(date.kind).toBe(FIELD_KINDS.DATE);
    expect(tags.kind).toBe(FIELD_KINDS.TAGS);
    const meta: ResolvedFieldMeta = text.meta;
    const wrappers: FieldWrappers = {
      optional: text.optional,
      nullable: text.nullable,
      hasDefault: text.hasDefault,
      readonly: text.readonly,
    };
    expect(meta.title).toBe("name");
    expect(wrappers.optional).toBe(false);
  });
  it("accepts TableFieldMeta inside z.meta() and emits DiagnosticIssue with a DiagnosticCode", () => {
    const tableMeta: TableFieldMeta = { hidden: true };
    const schema = z.object({
      id: z.string().meta({ table: tableMeta }),
    });
    const { fields } = interpretSchema(schema);
    expect(fields[0]?.meta.hidden).toBe(true);
    const code: DiagnosticCode = DIAGNOSTIC_CODES.UNSUPPORTED_SCHEMA;
    const issue: DiagnosticIssue = {
      code,
      path: "x",
      message: "example",
      hint: "sample hint",
    };
    expect(issue.code).toBe(DIAGNOSTIC_CODES.UNSUPPORTED_SCHEMA);
  });
});
