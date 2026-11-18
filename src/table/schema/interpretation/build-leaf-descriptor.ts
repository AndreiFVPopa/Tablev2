import { z } from "zod";

import { DIAGNOSTIC_CODES } from "../diagnostic-codes.constants";
import {
  BOOLEAN_CANONICAL_OPTIONS,
  resolveOptionUrlEncoding,
} from "../encoding/option-encoding-config";
import { FIELD_KINDS } from "../field-kinds.constants";
import { unwrapSchema } from "../unwrap-schema";

import type { FieldDescriptor } from "../descriptors";
import type {
  ArrayLeafInput,
  BuildLeafDescriptorInput,
  EnumLeafInput,
  StringEnumOptionsInput,
  UrlEncodingIssueInput,
} from "./build-leaf-descriptor.types";

export function buildLeafDescriptor({
  inner,
  base,
  diagnostics,
}: BuildLeafDescriptorInput): FieldDescriptor | null {
  if (inner instanceof z.ZodDate) {
    return { ...base, kind: FIELD_KINDS.DATE };
  }
  if (inner instanceof z.ZodNumber) {
    return { ...base, kind: FIELD_KINDS.NUMERIC, ...readNumberFacets(inner) };
  }
  if (inner instanceof z.ZodBoolean) {
    pushUrlEncodingIssue({
      base,
      optionValues: BOOLEAN_CANONICAL_OPTIONS,
      allowPositional: true,
      diagnostics,
    });
    return { ...base, kind: FIELD_KINDS.BOOLEAN };
  }
  if (inner instanceof z.ZodEnum) {
    return makeEnumDescriptor({ enumSchema: inner, base, diagnostics });
  }
  if (isStringLike(inner)) {
    return { ...base, kind: FIELD_KINDS.TEXT, ...readStringFacets(inner) };
  }
  if (inner instanceof z.ZodArray) {
    return makeArrayDescriptor({ arraySchema: inner, base, diagnostics });
  }
  diagnostics.push({
    code: DIAGNOSTIC_CODES.UNSUPPORTED_SCHEMA,
    path: base.path,
    message: `Field "${base.path}" uses ${schemaTypeName(inner)}, which the schema interpreter does not support.`,
    hint: "Supported kinds today: string, number, boolean, enum, date, array-of-enum, and nested object. Open a Phase-2 follow-up if you need another.",
  });
  return null;
}

function makeEnumDescriptor({
  enumSchema,
  base,
  diagnostics,
}: EnumLeafInput): FieldDescriptor | null {
  const stringOptions = collectStringEnumOptions({
    enumSchema,
    path: base.path,
    diagnostics,
  });
  if (!stringOptions) {
    return null;
  }
  pushUrlEncodingIssue({ base, optionValues: stringOptions, allowPositional: true, diagnostics });
  return {
    ...base,
    kind: FIELD_KINDS.ENUM,
    options: stringOptions,
  };
}

function makeArrayDescriptor({
  arraySchema,
  base,
  diagnostics,
}: ArrayLeafInput): FieldDescriptor | null {
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
  const stringOptions = collectStringEnumOptions({
    enumSchema: element,
    path: base.path,
    diagnostics,
  });
  if (!stringOptions) {
    return null;
  }
  pushUrlEncodingIssue({ base, optionValues: stringOptions, allowPositional: false, diagnostics });
  return {
    ...base,
    kind: FIELD_KINDS.TAGS,
    options: stringOptions,
  };
}

function pushUrlEncodingIssue({
  base,
  optionValues,
  allowPositional,
  diagnostics,
}: UrlEncodingIssueInput): void {
  const issue = resolveOptionUrlEncoding({
    requestedEncoding: base.meta.urlValueEncoding,
    optionValues,
    allowPositional,
    ...(base.meta.optionLabels !== undefined ? { optionLabels: base.meta.optionLabels } : {}),
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

function collectStringEnumOptions({
  enumSchema,
  path,
  diagnostics,
}: StringEnumOptionsInput): readonly string[] | null {
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
