export const FILTER_KINDS = {
  TEXT_SEARCH: "text-search",
  NUMBER_RANGE: "number-range",
  BOOLEAN_TRI: "boolean-tri",
  ENUM_SELECT: "enum-select",
  DATE_RANGE: "date-range",
  TAGS_MULTISELECT: "tags-multiselect",
} as const;

export type FilterKind = (typeof FILTER_KINDS)[keyof typeof FILTER_KINDS];
