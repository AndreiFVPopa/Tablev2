import type { DiagnosticIssue, FieldWrappers, ResolvedFieldMeta } from "../descriptors";
import type { z } from "zod";

export type LeafBase = FieldWrappers & {
  readonly path: string;
  readonly segments: readonly string[];
  readonly meta: ResolvedFieldMeta;
};

export interface BuildLeafDescriptorInput {
  readonly inner: z.ZodType;
  readonly base: LeafBase;
  readonly diagnostics: DiagnosticIssue[];
}

export interface EnumLeafInput {
  readonly enumSchema: z.ZodEnum;
  readonly base: LeafBase;
  readonly diagnostics: DiagnosticIssue[];
}

export interface ArrayLeafInput {
  readonly arraySchema: z.ZodArray;
  readonly base: LeafBase;
  readonly diagnostics: DiagnosticIssue[];
}

export interface UrlEncodingIssueInput {
  readonly base: LeafBase;
  readonly optionValues: readonly string[];
  readonly allowPositional: boolean;
  readonly diagnostics: DiagnosticIssue[];
}

export interface StringEnumOptionsInput {
  readonly enumSchema: z.ZodEnum;
  readonly path: string;
  readonly diagnostics: DiagnosticIssue[];
}
