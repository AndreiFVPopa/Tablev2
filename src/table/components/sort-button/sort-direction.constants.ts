export const SORT_DIRECTION = {
  ASCENDING: "asc",
  DESCENDING: "desc",
} as const;

export const ARIA_SORT = {
  ASCENDING: "ascending",
  DESCENDING: "descending",
  NONE: "none",
} as const;

export type AriaSortValue = (typeof ARIA_SORT)[keyof typeof ARIA_SORT];
