export const DIAGNOSTIC_CODES = {
  ROOT_NOT_OBJECT: "root-not-object",
  DOTTED_KEY: "dotted-key",
  UNSUPPORTED_SCHEMA: "unsupported-schema",
  NON_STRING_ENUM: "non-string-enum",
  NON_ENUM_ARRAY: "non-enum-array",
  EMPTY_ENUM: "empty-enum",
} as const;

export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[keyof typeof DIAGNOSTIC_CODES];
