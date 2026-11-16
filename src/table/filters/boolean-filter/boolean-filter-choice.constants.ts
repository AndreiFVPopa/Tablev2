export const BOOLEAN_FILTER_CHOICE = {
  ALL: "all",
  TRUE: "true",
  FALSE: "false",
} as const;

export type BooleanFilterChoice =
  (typeof BOOLEAN_FILTER_CHOICE)[keyof typeof BOOLEAN_FILTER_CHOICE];
