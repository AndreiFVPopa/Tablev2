import { type DATE_RANGE_BOUNDARY } from "@table/filters/date-range-filter/date-range-boundary.constants";
import { type NUMBER_RANGE_BOUNDARY } from "@table/filters/number-range-filter/number-range-boundary.constants";

import type { FieldDescriptor } from "@table/schema/descriptors";

export type RangeSubKey =
  | typeof NUMBER_RANGE_BOUNDARY.MINIMUM
  | typeof NUMBER_RANGE_BOUNDARY.MAXIMUM
  | typeof DATE_RANGE_BOUNDARY.FROM
  | typeof DATE_RANGE_BOUNDARY.TO;

export interface FilterKeyInput {
  readonly urlParam: string;
  readonly rangeSubKey?: RangeSubKey;
  readonly urlNamespace: string | undefined;
}

export interface TableSearchKeysInput {
  readonly fields: readonly FieldDescriptor[];
  readonly urlNamespace?: string;
}

export interface SearchKeyClaim {
  readonly key: string;
  readonly owner: string;
}

export interface SearchKeyCollision {
  readonly key: string;
  readonly owners: readonly string[];
}
