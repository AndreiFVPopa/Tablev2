export type UrlSortingState = readonly {
  readonly id: string;
  readonly desc: boolean;
}[];

export function stringifySort(sorting: UrlSortingState): string {
  const first = sorting[0];
  if (!first) return "";
  return first.desc ? `-${first.id}` : first.id;
}

export function parseSort(raw: unknown): UrlSortingState {
  if (typeof raw !== "string" || raw === "") return [];
  if (raw.startsWith("-")) {
    const id = raw.slice(1);
    if (id === "") return [];
    return [{ id, desc: true }];
  }
  return [{ id: raw, desc: false }];
}
