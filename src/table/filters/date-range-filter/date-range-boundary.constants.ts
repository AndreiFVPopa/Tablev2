export const DATE_RANGE_BOUNDARY = {
  FROM: "from",
  TO: "to",
} as const;

export type DateRangeBoundary = (typeof DATE_RANGE_BOUNDARY)[keyof typeof DATE_RANGE_BOUNDARY];
