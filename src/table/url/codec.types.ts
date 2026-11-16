import type { FieldDescriptor } from "@table/schema/descriptors";

export type SearchRecord = Readonly<Record<string, unknown>>;

export type EncodedSearchValue = string | number | boolean;

export interface CodecPaginationState {
  readonly pageIndex: number;
  readonly pageSize: number;
}

export type CodecSortingState = readonly {
  readonly id: string;
  readonly desc: boolean;
}[];

export type CodecColumnFiltersState = readonly {
  readonly id: string;
  readonly value: unknown;
}[];

export interface CodecTableState {
  readonly pagination: CodecPaginationState;
  readonly sorting: CodecSortingState;
  readonly columnFilters: CodecColumnFiltersState;
}

export interface CodecOptions {
  readonly fields: readonly FieldDescriptor[];
  readonly urlNamespace?: string;
  readonly defaultPageSize: number;
  readonly pageSizes: readonly number[];
  readonly tableSearchKeySet: ReadonlySet<string>;
}
