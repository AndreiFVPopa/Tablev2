import { z } from "zod";

import { DIAGNOSTIC_CODES } from "./diagnostic-codes.constants";
import { FIELD_KINDS } from "./field-kinds.constants";

import type {
  DiagnosticIssue,
  FieldDescriptor,
  FieldWrappers,
  InterpretationResult,
  ResolvedFieldMeta,
} from "./descriptors";
export interface InterpretOptions {
  readonly throwOnDiagnostics?: boolean;
}
export class SchemaInterpretationError extends Error {
  readonly diagnostics: readonly DiagnosticIssue[];
  constructor(diagnostics: readonly DiagnosticIssue[]) {
    super(summarizeDiagnostics(diagnostics));
    this.name = "SchemaInterpretationError";
    this.diagnostics = diagnostics;
  }
}
export function interpretSchema(
  schema: z.ZodType,
  options: InterpretOptions = {},
): InterpretationResult {
  const diagnostics: DiagnosticIssue[] = [];
  const fields: FieldDescriptor[] = [];
  const rootUnwrapped = unwrapSchema(schema);
  if (!(rootUnwrapped.inner instanceof z.ZodObject)) {
    diagnostics.push({
      code: DIAGNOSTIC_CODES.ROOT_NOT_OBJECT,
      path: "",
      message: `Root schema must be z.object(...); got ${describeSchema(rootUnwrapped.inner)}`,
      hint: "Wrap your fields in z.object({ ... }) before passing them to the table.",
    });
    return finalize({ fields, diagnostics }, options);
  }
  walkObject(rootUnwrapped.inner, [], fields, diagnostics);
  return finalize({ fields, diagnostics }, options);
}
function walkObject(
  objectSchema: z.ZodObject,
  parentSegments: readonly string[],
  fields: FieldDescriptor[],
  diagnostics: DiagnosticIssue[],
): void {
  for (const [rawKey, child] of Object.entries(objectSchema.shape)) {
    const segments = [...parentSegments, rawKey];
    const path = segments.join(".");
    if (rawKey.includes(".")) {
      diagnostics.push({
        code: DIAGNOSTIC_CODES.DOTTED_KEY,
        path,
        message: `Schema key "${rawKey}" contains a literal "." which collides with the nested-path separator.`,
        hint: "Rename the key to use underscores or camelCase, or model the nesting with z.object(...).",
      });
      continue;
    }
    describeField(asClassic(child), segments, fields, diagnostics);
  }
}
function describeField(
  schema: z.ZodType,
  segments: readonly string[],
  fields: FieldDescriptor[],
  diagnostics: DiagnosticIssue[],
): void {
  const { inner, wrappers } = unwrapSchema(schema);
  if (inner instanceof z.ZodObject) {
    walkObject(inner, segments, fields, diagnostics);
    return;
  }
  const meta = resolveMeta(schema, segments);
  const base: LeafBase = {
    path: segments.join("."),
    segments,
    meta,
    ...wrappers,
  };
  const descriptor = buildLeafDescriptor(inner, base, diagnostics);
  if (descriptor) {
    fields.push(descriptor);
  }
}
interface LeafBase extends FieldWrappers {
  readonly path: string;
  readonly segments: readonly string[];
  readonly meta: ResolvedFieldMeta;
}
function buildLeafDescriptor(
  inner: z.ZodType,
  base: LeafBase,
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
    message: `Field "${base.path}" uses ${describeSchema(inner)}, which the schema interpreter does not support.`,
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
  return { ...base, kind: FIELD_KINDS.ENUM, options: stringOptions };
}
function makeArrayDescriptor(
  arraySchema: z.ZodArray,
  base: LeafBase,
  diagnostics: DiagnosticIssue[],
): FieldDescriptor | null {
  const element = unwrapSchema(asClassic(arraySchema.element)).inner;
  if (!(element instanceof z.ZodEnum)) {
    diagnostics.push({
      code: DIAGNOSTIC_CODES.NON_ENUM_ARRAY,
      path: base.path,
      message: `Field "${base.path}" is an array of ${describeSchema(element)}; only arrays of enum are supported as tag columns.`,
      hint: "Switch the element to z.enum([...]) or model the collection as a nested object with its own table.",
    });
    return null;
  }
  const stringOptions = collectStringEnumOptions(element, base.path, diagnostics);
  if (!stringOptions) {
    return null;
  }
  return { ...base, kind: FIELD_KINDS.TAGS, options: stringOptions };
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
interface UnwrapResult {
  readonly inner: z.ZodType;
  readonly wrappers: FieldWrappers;
}
function unwrapSchema(schema: z.ZodType): UnwrapResult {
  let current: z.ZodType = schema;
  let optional = false;
  let nullable = false;
  let hasDefault = false;
  let isReadonly = false;
  for (let depth = 0; depth < 32; depth += 1) {
    if (current instanceof z.ZodOptional) {
      optional = true;
      current = asClassic(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodNullable) {
      nullable = true;
      current = asClassic(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodDefault) {
      hasDefault = true;
      current = asClassic(current.unwrap());
      continue;
    }
    if (current instanceof z.ZodReadonly) {
      isReadonly = true;
      current = asClassic(current.unwrap());
      continue;
    }
    break;
  }
  return {
    inner: current,
    wrappers: { optional, nullable, hasDefault, readonly: isReadonly },
  };
}
function asClassic(schema: unknown): z.ZodType {
  return schema as z.ZodType;
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
function resolveMeta(schema: z.ZodType, segments: readonly string[]): ResolvedFieldMeta {
  const metaChain = walkMetaChain(schema);
  const lastSegment = segments.at(-1) ?? "";
  return {
    title: pickString(metaChain, "title") ?? lastSegment,
    description: pickString(metaChain, "description"),
    deprecated: pickBoolean(metaChain, "deprecated") ?? false,
    hidden: Boolean(pickTableFlag(metaChain, "hidden")),
  };
}
function walkMetaChain(schema: z.ZodType): readonly Record<string, unknown>[] {
  const chain: Record<string, unknown>[] = [];
  let current: z.ZodType | undefined = schema;
  for (let depth = 0; current && depth < 32; depth += 1) {
    const meta = current.meta();
    if (meta) {
      chain.unshift(meta);
    }
    current = tryUnwrap(current);
  }
  return chain;
}
function tryUnwrap(schema: z.ZodType): z.ZodType | undefined {
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault ||
    schema instanceof z.ZodReadonly
  ) {
    return asClassic(schema.unwrap());
  }
  return undefined;
}
function pickString(
  chain: readonly Record<string, unknown>[],
  key: "title" | "description",
): string | undefined {
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const value = chain[i]?.[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}
function pickBoolean(
  chain: readonly Record<string, unknown>[],
  key: "deprecated",
): boolean | undefined {
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const value = chain[i]?.[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}
function pickTableFlag(
  chain: readonly Record<string, unknown>[],
  key: "hidden",
): boolean | undefined {
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const table = chain[i]?.table;
    if (table && typeof table === "object" && !Array.isArray(table)) {
      const value = (table as Record<string, unknown>)[key];
      if (typeof value === "boolean") return value;
    }
  }
  return undefined;
}
function finalize(
  result: {
    fields: readonly FieldDescriptor[];
    diagnostics: readonly DiagnosticIssue[];
  },
  options: InterpretOptions,
): InterpretationResult {
  if (options.throwOnDiagnostics && result.diagnostics.length > 0) {
    throw new SchemaInterpretationError(result.diagnostics);
  }
  return result;
}
function summarizeDiagnostics(diagnostics: readonly DiagnosticIssue[]): string {
  const bullets = diagnostics
    .map((d: DiagnosticIssue) => `  [${d.code}] ${d.path || "<root>"}: ${d.message}`)
    .join("\n");
  return `Schema interpretation produced ${String(diagnostics.length)} diagnostic(s):\n${bullets}`;
}
function describeSchema(schema: z.ZodType): string {
  const name = (
    schema as {
      constructor?: {
        name?: unknown;
      };
    }
  ).constructor?.name;
  return typeof name === "string" ? name : "<unknown schema>";
}
