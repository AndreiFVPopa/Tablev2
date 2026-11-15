export const FIELD_KINDS = {
  TEXT: "text",
  NUMERIC: "numeric",
  BOOLEAN: "boolean",
  ENUM: "enum",
  DATE: "date",
  TAGS: "tags",
} as const;

export type FieldKind = (typeof FIELD_KINDS)[keyof typeof FIELD_KINDS];
