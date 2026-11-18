import { z } from "zod";

import { DIAGNOSTIC_CODES, type DiagnosticCode } from "../diagnostic-codes.constants";
import { resolveFieldMeta } from "../metadata/resolve-field-meta";
import { unwrapSchema } from "../unwrap-schema";

import { buildLeafDescriptor } from "./build-leaf-descriptor";

import type { DiagnosticIssue, FieldDescriptor, InterpretationResult } from "../descriptors";
import type { DescribeFieldInput, InterpretOptions, WalkObjectInput } from "./interpret.types";

export type { InterpretOptions } from "./interpret.types";

export class SchemaInterpretationError extends Error {
  readonly diagnostics: readonly DiagnosticIssue[];
  constructor(diagnostics: readonly DiagnosticIssue[]) {
    super(summarizeDiagnostics(diagnostics));
    this.name = "SchemaInterpretationError";
    this.diagnostics = diagnostics;
  }
}

const FATAL_DIAGNOSTIC_CODES: ReadonlySet<DiagnosticCode> = new Set([
  DIAGNOSTIC_CODES.URL_VALUE_ENCODING_UNSUPPORTED,
  DIAGNOSTIC_CODES.URL_SLUG_COLLISION,
]);

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
      message: `Root schema must be z.object(...); got ${schemaTypeName(rootUnwrapped.inner)}`,
      hint: "Wrap your fields in z.object({ ... }) before passing them to the table.",
    });
    return finalize({ fields, diagnostics }, options);
  }
  walkObject({
    objectSchema: rootUnwrapped.inner,
    parentSegments: [],
    fields,
    diagnostics,
  });
  return finalize({ fields, diagnostics }, options);
}

function walkObject({ objectSchema, parentSegments, fields, diagnostics }: WalkObjectInput): void {
  for (const rawKey of Object.keys(objectSchema.shape)) {
    const child = readObjectShapeChild(objectSchema, rawKey);
    if (child === undefined) continue;
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
    describeField({ schema: child, segments, fields, diagnostics });
  }
}

function readObjectShapeChild(objectSchema: z.ZodObject, key: string): z.ZodType | undefined {
  if (!Object.hasOwn(objectSchema.shape, key)) {
    return undefined;
  }
  const child: unknown = Reflect.get(objectSchema.shape, key);
  return child instanceof z.ZodType ? child : undefined;
}

function describeField({ schema, segments, fields, diagnostics }: DescribeFieldInput): void {
  const { inner, wrappers } = unwrapSchema(schema);
  if (inner instanceof z.ZodObject) {
    walkObject({ objectSchema: inner, parentSegments: segments, fields, diagnostics });
    return;
  }
  const meta = resolveFieldMeta({ schema, segments, diagnostics });
  const descriptor = buildLeafDescriptor({
    inner,
    base: {
      path: segments.join("."),
      segments,
      meta,
      ...wrappers,
    },
    diagnostics,
  });
  if (descriptor) {
    fields.push(descriptor);
  }
}

function finalize(
  result: {
    fields: readonly FieldDescriptor[];
    diagnostics: readonly DiagnosticIssue[];
  },
  options: InterpretOptions,
): InterpretationResult {
  const hasFatalConfigIssue = result.diagnostics.some((issue) =>
    FATAL_DIAGNOSTIC_CODES.has(issue.code),
  );
  if ((options.throwOnDiagnostics || hasFatalConfigIssue) && result.diagnostics.length > 0) {
    throw new SchemaInterpretationError(result.diagnostics);
  }
  return result;
}

function summarizeDiagnostics(diagnostics: readonly DiagnosticIssue[]): string {
  const bullets = diagnostics
    .map((issue) => `  [${issue.code}] ${issue.path || "<root>"}: ${issue.message}`)
    .join("\n");
  return `Schema interpretation produced ${String(diagnostics.length)} diagnostic(s):\n${bullets}`;
}

function schemaTypeName(schema: z.ZodType): string {
  const constructorName = schema.constructor.name;
  return constructorName.length > 0 ? constructorName : "<unknown schema>";
}
