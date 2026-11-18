import type { DiagnosticIssue, FieldDescriptor } from "../descriptors";
import type { z } from "zod";

export interface InterpretOptions {
  readonly throwOnDiagnostics?: boolean;
}

export interface WalkObjectInput {
  readonly objectSchema: z.ZodObject;
  readonly parentSegments: readonly string[];
  readonly fields: FieldDescriptor[];
  readonly diagnostics: DiagnosticIssue[];
}

export interface DescribeFieldInput {
  readonly schema: z.ZodType;
  readonly segments: readonly string[];
  readonly fields: FieldDescriptor[];
  readonly diagnostics: DiagnosticIssue[];
}
