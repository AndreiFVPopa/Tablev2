import { FIELD_KINDS, type FieldKind } from "./field-kinds.constants";
import { FILTER_KINDS, type FilterKind } from "./filter-kinds.constants";

import type { DiagnosticCode } from "./diagnostic-codes.constants";

export { DIAGNOSTIC_CODES } from "./diagnostic-codes.constants";
export { FIELD_KINDS } from "./field-kinds.constants";
export { FILTER_KINDS } from "./filter-kinds.constants";
export type { DiagnosticCode, FieldKind, FilterKind };

declare module "zod/v4/core" {
  interface GlobalMeta {
    table?: TableFieldMeta;
  }
}

export interface TableFieldMeta {
  hidden?: boolean;
}

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
}

export interface BaseFieldDescriptor extends FieldWrappers {
  readonly path: string;
  readonly segments: readonly string[];
  readonly kind: FieldKind;
  readonly meta: ResolvedFieldMeta;
}

export interface TextFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: typeof FIELD_KINDS.TEXT;
  readonly minLength: number | undefined;
  readonly maxLength: number | undefined;
  readonly format: string | undefined;
}

export interface NumericFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: typeof FIELD_KINDS.NUMERIC;
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly integer: boolean;
  readonly format: string | undefined;
}

export interface BooleanFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: typeof FIELD_KINDS.BOOLEAN;
}

export interface EnumFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: typeof FIELD_KINDS.ENUM;
  readonly options: readonly string[];
}

export interface DateFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: typeof FIELD_KINDS.DATE;
}

export interface TagsFieldDescriptor extends BaseFieldDescriptor {
  readonly kind: typeof FIELD_KINDS.TAGS;
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

export function isSortableKind(kind: FieldKind): boolean {
  switch (kind) {
    case FIELD_KINDS.TEXT:
    case FIELD_KINDS.NUMERIC:
    case FIELD_KINDS.DATE:
    case FIELD_KINDS.BOOLEAN:
    case FIELD_KINDS.ENUM:
      return true;
    case FIELD_KINDS.TAGS:
      return false;
  }
}

export function defaultFilterKind(kind: FieldKind): FilterKind {
  switch (kind) {
    case FIELD_KINDS.TEXT:
      return FILTER_KINDS.TEXT_SEARCH;
    case FIELD_KINDS.NUMERIC:
      return FILTER_KINDS.NUMBER_RANGE;
    case FIELD_KINDS.BOOLEAN:
      return FILTER_KINDS.BOOLEAN_TRI;
    case FIELD_KINDS.ENUM:
      return FILTER_KINDS.ENUM_SELECT;
    case FIELD_KINDS.DATE:
      return FILTER_KINDS.DATE_RANGE;
    case FIELD_KINDS.TAGS:
      return FILTER_KINDS.TAGS_MULTISELECT;
  }
}
