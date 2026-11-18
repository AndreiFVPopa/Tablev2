import { constructSortFn } from "@tanstack/react-table";

export function normalizeTextSortValue(value: unknown): string {
  return typeof value === "string" ? value.toLocaleLowerCase() : "";
}

export function compareTextValues(left: string, right: string): number {
  if (left === right) return 0;
  if (left === "") return 1;
  if (right === "") return -1;
  return left.localeCompare(right);
}

export const sortText = constructSortFn({
  resolveDataValue: normalizeTextSortValue,
  sort: (dataValueA: string, dataValueB: string) => compareTextValues(dataValueA, dataValueB),
});
