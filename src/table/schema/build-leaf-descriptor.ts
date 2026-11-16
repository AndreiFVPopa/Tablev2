import { z } from "zod";

import { DIAGNOSTIC_CODES } from "./diagnostic-codes.constants";
import { FIELD_KINDS } from "./field-kinds.constants";
import { resolveOptionUrlEncoding } from "./option-encoding-config";
import { unwrapSchema } from "./unwrap-schema";

import type {
  DiagnosticIssue,
  FieldDescriptor,
  FieldWrappers,
  ResolvedFieldMeta,
} from "./descriptors";

type LeafBase = FieldWrappers & {
  readonly path: string;
  readonly segments: readonly string[];
  readonly meta: ResolvedFieldMeta;
};

export function buildLeafDescriptor(
  inner: z.ZodType,
  base: FieldWrappers & {
    readonly path: string;
    readonly segments: readonly string[];
    readonly meta: ResolvedFieldMeta;
  },
  diagnostics: DiagnosticIssue[],
): FieldDescriptor | null {
  if (inner instanceof z.ZodDate) {
    return { ...base, kind: FIELD_KINDS.DATE };
  }
  if (inner instanceof z.ZodNumber) {
    return { ...base, kind: FIELD_KINDS.NUMERIC, ...readNumberFacets(inner) };
  }
  if (inner instanceof z.ZodBoolean) {
    return { ...base, kind: FIELD_KINDS.BOOLEAN };
  }
  if (inner instanceof z.ZodEnum) {
    return makeEnumDescriptor(inner, base, diagnostics);
  }
  if (isStringLike(inner)) {
    return { ...base, kind: FIELD_KINDS.TEXT, ...readStringFacets(inner) };
  }
  if (inner instanceof z.ZodArray) {
    return makeArrayDescriptor(inner, base, diagnostics);
  }
  diagnostics.push({
    code: DIAGNOSTIC_CODES.UNSUPPORTED_SCHEMA,
    path: base.path,
    message: `Field "${base.path}" uses ${schemaTypeName(inner)}, which the schema interpreter does not support.`,
    hint: "Supported kinds today: string, number, boolean, enum, date, array-of-enum, and nested object. Open a Phase-2 follow-up if you need another.",
  });
  return null;
}

function makeEnumDescriptor(
  enumSchema: z.ZodEnum,
  base: LeafBase,
  diagnostics: DiagnosticIssue[],
): FieldDescriptor | null {
  const stringOptions = collectStringEnumOptions(enumSchema, base.path, diagnostics);
  if (!stringOptions) {
    return null;
  }
  pushUrlEncodingIssue(base, stringOptions, true, diagnostics);
  return {
    ...base,
    kind: FIELD_KINDS.ENUM,
    options: stringOptions,
  };
}

function makeArrayDescriptor(
  arraySchema: z.ZodArray,
  base: LeafBase,
  diagnostics: DiagnosticIssue[],
): FieldDescriptor | null {
  const element = unwrapSchema(arraySchema.element as z.ZodType).inner;
  if (!(element instanceof z.ZodEnum)) {
    diagnostics.push({
      code: DIAGNOSTIC_CODES.NON_ENUM_ARRAY,
      path: base.path,
      message: `Field "${base.path}" is an array of ${schemaTypeName(element)}; only arrays of enum are supported as tag columns.`,
      hint: "Switch the element to z.enum([...]) or model the collection as a nested object with its own table.",
    });
    return null;
  }
  const stringOptions = collectStringEnumOptions(element, base.path, diagnostics);
  if (!stringOptions) {
    return null;
  }
  pushUrlEncodingIssue(base, stringOptions, false, diagnostics);
  return {
    ...base,
    kind: FIELD_KINDS.TAGS,
    options: stringOptions,
  };
}

function pushUrlEncodingIssue(
  base: LeafBase,
  optionValues: readonly string[],
  allowPositional: boolean,
  diagnostics: DiagnosticIssue[],
): void {
  const issue = resolveOptionUrlEncoding({
    requestedEncoding: base.meta.urlValueEncoding,
    optionValues,
    allowPositional,
    ...(base.meta.urlSlugOverrides !== undefined
      ? { slugOverrides: base.meta.urlSlugOverrides }
      : {}),
  });
  if (issue === undefined) {
    return;
  }
  diagnostics.push({
    code: issue.code,
    path: base.path,
    message: `Field "${base.path}" rejected urlValueEncoding "${base.meta.urlValueEncoding}": ${issue.message}.`,
    hint: issue.hint,
  });
}

function collectStringEnumOptions(
  enumSchema: z.ZodEnum,
  path: string,
  diagnostics: DiagnosticIssue[],
): readonly string[] | null {
  const options = enumSchema.options;
  if (options.length === 0) {
    diagnostics.push({
      code: DIAGNOSTIC_CODES.EMPTY_ENUM,
      path,
      message: `Field "${path}" is an empty enum; nothing can ever match.`,
      hint: "Add at least one value to the enum or remove the field from the schema.",
    });
    return null;
  }
  const strings: string[] = [];
  for (const option of options) {
    if (typeof option !== "string") {
      diagnostics.push({
        code: DIAGNOSTIC_CODES.NON_STRING_ENUM,
        path,
        message: `Field "${path}" uses a non-string enum (received ${typeof option}); only string enums render reliably.`,
        hint: 'Convert the enum to string literals, for example z.enum(["a", "b"]).',
      });
      return null;
    }
    strings.push(option);
  }
  return strings;
}

function isStringLike(schema: z.ZodType): schema is z.ZodString | z.ZodStringFormat {
  return schema instanceof z.ZodString || schema instanceof z.ZodStringFormat;
}

function readStringFacets(schema: z.ZodString | z.ZodStringFormat): {
  readonly minLength: number | undefined;
  readonly maxLength: number | undefined;
  readonly format: string | undefined;
} {
  return {
    minLength: schema.minLength ?? undefined,
    maxLength: schema.maxLength ?? undefined,
    format: schema.format ?? undefined,
  };
}

function readNumberFacets(schema: z.ZodNumber): {
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly integer: boolean;
  readonly format: string | undefined;
} {
  const format = schema.format ?? undefined;
  const integer = format === "safeint" || format === "int32" || format === "uint32";
  return {
    min: schema.minValue ?? undefined,
    max: schema.maxValue ?? undefined,
    integer,
    format,
  };
}

function schemaTypeName(schema: z.ZodType): string {
  const constructorName = schema.constructor.name;
  return constructorName.length > 0 ? constructorName : "<unknown schema>";
}
