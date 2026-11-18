export { interpretSchema, SchemaInterpretationError } from "./interpretation/interpret";
export type { InterpretOptions } from "./interpretation/interpret";
export { DIAGNOSTIC_CODES, FIELD_KINDS } from "./descriptors";
export type {
  BooleanFieldDescriptor,
  DateFieldDescriptor,
  DiagnosticCode,
  DiagnosticIssue,
  EnumFieldDescriptor,
  FieldDescriptor,
  FieldKind,
  FieldWrappers,
  InterpretationResult,
  NumericFieldDescriptor,
  ResolvedFieldMeta,
  TableFieldMeta,
  TagsFieldDescriptor,
  TextFieldDescriptor,
} from "./descriptors";
export { URL_VALUE_ENCODINGS } from "./url-value-encoding.constants";
export type { UrlValueEncoding } from "./url-value-encoding.constants";
export { resolveOptionUrlEncoding } from "./encoding/option-encoding-config";
export type { OptionUrlEncodingIssue } from "./encoding/option-encoding-config";
export { toUrlSlug } from "@table/lib/to-url-slug";
