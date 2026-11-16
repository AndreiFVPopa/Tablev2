export const NUMBER_RANGE_BOUNDARY = {
  MINIMUM: "min",
  MAXIMUM: "max",
} as const;

export type NumberRangeBoundary =
  (typeof NUMBER_RANGE_BOUNDARY)[keyof typeof NUMBER_RANGE_BOUNDARY];
