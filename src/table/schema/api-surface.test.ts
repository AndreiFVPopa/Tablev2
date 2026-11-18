import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";

import {
  DIAGNOSTIC_CODES,
  FIELD_KINDS,
  interpretSchema,
  SchemaInterpretationError,
  type BooleanFieldDescriptor,
  type DateFieldDescriptor,
  type DiagnosticCode,
  type DiagnosticIssue,
  type EnumFieldDescriptor,
  type FieldDescriptor,
  type FieldKind,
  type FieldWrappers,
  type InterpretationResult,
  type InterpretOptions,
  type NumericFieldDescriptor,
  type OptionUrlEncodingIssue,
  type ResolvedFieldMeta,
  type TableFieldMeta,
  type TagsFieldDescriptor,
  type TextFieldDescriptor,
  type UrlValueEncoding,
  URL_VALUE_ENCODINGS,
  decodeDescriptorOption,
  decodeOptionFromUrlToken,
  encodeDescriptorOption,
  encodeOptionToUrlToken,
  resolveOptionUrlEncoding,
  toUrlSlug,
} from "../index";
describe("schema interpreter — public API surface", () => {
  it("exports runtime values with their documented shapes", () => {
    expect(typeof interpretSchema).toBe("function");
    expect(typeof SchemaInterpretationError).toBe("function");
    expect(typeof resolveOptionUrlEncoding).toBe("function");
    expect(typeof encodeOptionToUrlToken).toBe("function");
    expect(typeof decodeOptionFromUrlToken).toBe("function");
    expect(typeof encodeDescriptorOption).toBe("function");
    expect(typeof decodeDescriptorOption).toBe("function");
    expect(typeof toUrlSlug).toBe("function");
    expect(FIELD_KINDS.TEXT).toBe("text");
    expect(DIAGNOSTIC_CODES.ROOT_NOT_OBJECT).toBe("root-not-object");
    expect(URL_VALUE_ENCODINGS.POSITIONAL).toBe("positional");
    const encoding: UrlValueEncoding = URL_VALUE_ENCODINGS.SLUG;
    const diacriticOption = "bursă";
    const issue = resolveOptionUrlEncoding({
      requestedEncoding: encoding,
      optionValues: [diacriticOption],
      allowPositional: false,
    });
    expect(issue).toBeUndefined();
    expect(toUrlSlug(diacriticOption)).toBe("bursa");
    expect(
      encodeOptionToUrlToken({
        canonicalOption: diacriticOption,
        optionValues: [diacriticOption],
        encoding,
      }),
    ).toBe("bursa");
    expect(
      decodeOptionFromUrlToken({
        urlToken: "bursa",
        optionValues: [diacriticOption],
        encoding,
      }),
    ).toBe(diacriticOption);
    const err = new SchemaInterpretationError([
      { code: DIAGNOSTIC_CODES.ROOT_NOT_OBJECT, path: "", message: "sample", hint: "fix it" },
    ]);
    expect(err).toBeInstanceOf(SchemaInterpretationError);
    expect(err.diagnostics).toHaveLength(1);

    type EncodeArgs = Parameters<typeof encodeOptionToUrlToken>;
    type DecodeArgs = Parameters<typeof decodeOptionFromUrlToken>;
    expectTypeOf<EncodeArgs["length"]>().toEqualTypeOf<1>();
    expectTypeOf<DecodeArgs["length"]>().toEqualTypeOf<1>();
    expectTypeOf<EncodeArgs[0]>().toHaveProperty("canonicalOption");
    expectTypeOf<EncodeArgs[0]>().toHaveProperty("optionValues");
    expectTypeOf<EncodeArgs[0]>().toHaveProperty("encoding");
    expectTypeOf<EncodeArgs[0]>().toHaveProperty("slugOverrides");
    expectTypeOf<DecodeArgs[0]>().toHaveProperty("urlToken");
    expectTypeOf<DecodeArgs[0]>().toHaveProperty("optionValues");
    expectTypeOf<DecodeArgs[0]>().toHaveProperty("encoding");
    expectTypeOf<DecodeArgs[0]>().toHaveProperty("slugOverrides");
    expectTypeOf<DecodeArgs[0]>().toHaveProperty("optionLabels");
    function rejectPositionalOptionTokens(): void {
      // @ts-expect-error public option helpers take one options object, not positional strings
      encodeOptionToUrlToken(diacriticOption, [diacriticOption], encoding);
      // @ts-expect-error public option helpers take one options object, not positional strings
      decodeOptionFromUrlToken("bursa", [diacriticOption], encoding);
    }
    expect(rejectPositionalOptionTokens).toBeTypeOf("function");
  });
  it("exposes FieldKind values", () => {
    const kinds: FieldKind[] = Object.values(FIELD_KINDS);
    expect(kinds).toHaveLength(6);
    expect(kinds).toEqual(expect.arrayContaining(["text", "numeric", "tags"]));
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
    const tableMeta: TableFieldMeta = {
      hidden: true,
      urlParam: "gen",
      urlValueEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionLabels: { male: "Masculin" },
    };
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
    const encodingIssue: OptionUrlEncodingIssue = {
      code: DIAGNOSTIC_CODES.URL_SLUG_COLLISION,
      message: "collision",
      hint: "override",
    };
    expect(encodingIssue.code).toBe(DIAGNOSTIC_CODES.URL_SLUG_COLLISION);
  });
});
