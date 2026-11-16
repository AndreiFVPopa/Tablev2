export const DIAGNOSTIC_CODES = {
  ROOT_NOT_OBJECT: "root-not-object",
  DOTTED_KEY: "dotted-key",
  UNSUPPORTED_SCHEMA: "unsupported-schema",
  NON_STRING_ENUM: "non-string-enum",
  NON_ENUM_ARRAY: "non-enum-array",
  EMPTY_ENUM: "empty-enum",
  INVALID_FIELD_META: "invalid-field-meta",
  URL_VALUE_ENCODING_UNSUPPORTED: "url-value-encoding-unsupported",
  URL_SLUG_COLLISION: "url-slug-collision",
} as const;

export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[keyof typeof DIAGNOSTIC_CODES];
