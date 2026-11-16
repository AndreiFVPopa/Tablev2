import type { DiagnosticCode } from "./diagnostic-codes.constants";
import type { FieldKind } from "./field-kinds.constants";
import type { UrlValueEncoding } from "./url-value-encoding.constants";

export { DIAGNOSTIC_CODES } from "./diagnostic-codes.constants";
export { FIELD_KINDS } from "./field-kinds.constants";
export type { TableFieldMeta } from "./field-meta.schema";
export type { DiagnosticCode, FieldKind };

export interface FieldWrappers {
  readonly optional: boolean;
  readonly nullable: boolean;
  readonly hasDefault: boolean;
  readonly readonly: boolean;
}

export interface ResolvedFieldMeta {
  readonly title: string;
  readonly description: string | undefined;
  readonly deprecated: boolean;
  readonly hidden: boolean;
  readonly urlParam: string | undefined;
  readonly urlValueEncoding: UrlValueEncoding;
  readonly urlSlugOverrides: Readonly<Record<string, string>> | undefined;
  readonly optionLabels: Readonly<Record<string, string>> | undefined;
}

export interface BaseFieldDescriptor extends FieldWrappers {
  readonly path: string;
  readonly segments: readonly string[];
  readonly kind: FieldKind;
  readonly meta: ResolvedFieldMeta;
}

export interface TextFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: Extract<FieldKind, "text">;
  readonly minLength: number | undefined;
  readonly maxLength: number | undefined;
  readonly format: string | undefined;
}

export interface NumericFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: Extract<FieldKind, "numeric">;
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly integer: boolean;
  readonly format: string | undefined;
}

export interface BooleanFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: Extract<FieldKind, "boolean">;
}

export interface EnumFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: Extract<FieldKind, "enum">;
  readonly options: readonly string[];
}

export interface DateFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: Extract<FieldKind, "date">;
}

export interface TagsFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: Extract<FieldKind, "tags">;
  readonly options: readonly string[];
}

export type FieldDescriptor =
  | TextFieldDescriptor
  | NumericFieldDescriptor
  | BooleanFieldDescriptor
  | EnumFieldDescriptor
  | DateFieldDescriptor
  | TagsFieldDescriptor;

export interface DiagnosticIssue {
  readonly code: DiagnosticCode;
  readonly path: string;
  readonly message: string;
  readonly hint: string;
}

export interface InterpretationResult {
  readonly fields: readonly FieldDescriptor[];
  readonly diagnostics: readonly DiagnosticIssue[];
}
