import type { DiagnosticIssue } from "./descriptors";
import type { UrlValueEncoding } from "./url-value-encoding.constants";
import type { z } from "zod";

export interface MutableFieldMeta {
  title: string | undefined;
  description: string | undefined;
  deprecated: boolean | undefined;
  hidden: boolean | undefined;
  urlParam: string | undefined;
  urlValueEncoding: UrlValueEncoding | undefined;
  urlSlugOverrides: Readonly<Record<string, string>> | undefined;
  optionLabels: Readonly<Record<string, string>> | undefined;
}

export interface ResolveFieldMetaInput {
  readonly schema: z.ZodType;
  readonly segments: readonly string[];
  readonly diagnostics: DiagnosticIssue[];
}

export interface ApplyMetaLayerInput {
  readonly merged: MutableFieldMeta;
  readonly layer: unknown;
  readonly path: string;
  readonly diagnostics: DiagnosticIssue[];
}

export interface ApplyOptionalStringInput {
  readonly merged: MutableFieldMeta;
  readonly key: "title" | "description";
  readonly value: unknown;
  readonly path: string;
  readonly diagnostics: DiagnosticIssue[];
}

export interface ApplyOptionalBooleanInput {
  readonly merged: MutableFieldMeta;
  readonly value: unknown;
  readonly path: string;
  readonly diagnostics: DiagnosticIssue[];
}

export interface PushZodIssuesInput {
  readonly diagnostics: DiagnosticIssue[];
  readonly path: string;
  readonly prefix: string;
  readonly error: z.ZodError;
}

export interface PushInvalidMetaInput {
  readonly diagnostics: DiagnosticIssue[];
  readonly path: string;
  readonly key: string;
  readonly detail: string;
}
