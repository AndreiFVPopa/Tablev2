export type UrlSortingState = readonly {
  readonly id: string;
  readonly desc: boolean;
}[];

export function parseSort(inputValue: unknown): UrlSortingState {
  if (typeof inputValue !== "string" || inputValue === "") return [];
  if (inputValue.startsWith("-")) {
    const columnId = inputValue.slice(1);
    return columnId === "" ? [] : [{ id: columnId, desc: true }];
  }
  return [{ id: inputValue, desc: false }];
}

export function stringifySort(sorting: UrlSortingState): string {
  if (sorting.length === 0) return "";
  const [primarySort] = sorting;
  if (primarySort === undefined) return "";
  return primarySort.desc ? `-${primarySort.id}` : primarySort.id;
}
