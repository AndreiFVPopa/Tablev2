import type { SortDirection } from "@tanstack/react-table";

export type AriaSortAttribute = NonNullable<React.AriaAttributes["aria-sort"]>;

export function ariaSortFor(
  direction: false | SortDirection,
  canSort: boolean,
): AriaSortAttribute | undefined {
  if (direction === "asc") return "ascending";
  if (direction === "desc") return "descending";
  return canSort ? "none" : undefined;
}
