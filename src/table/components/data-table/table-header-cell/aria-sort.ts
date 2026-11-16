import { ARIA_SORT, SORT_DIRECTION } from "../../sort-button/sort-direction.constants";

import type { AriaSortValue } from "../../sort-button/sort-direction.constants";
import type { SortDirection } from "@tanstack/react-table";

export function ariaSortFor(
  direction: false | SortDirection,
  canSort: boolean,
): AriaSortValue | undefined {
  if (direction === SORT_DIRECTION.ASCENDING) return ARIA_SORT.ASCENDING;
  if (direction === SORT_DIRECTION.DESCENDING) return ARIA_SORT.DESCENDING;
  return canSort ? ARIA_SORT.NONE : undefined;
}
