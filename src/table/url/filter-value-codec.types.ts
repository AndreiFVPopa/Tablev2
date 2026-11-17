import type {
  CodecColumnFiltersState,
  CodecOptions,
  EncodedSearchValue,
  SearchRecord,
} from "./codec.types";
import type { FieldDescriptor } from "@table/schema/descriptors";

export interface EncodedFilterParts {
  readonly value?: EncodedSearchValue;
  readonly min?: number;
  readonly max?: number;
  readonly from?: string;
  readonly to?: string;
}

export interface WriteEncodedFiltersInput {
  readonly encodedSearch: Record<string, EncodedSearchValue>;
  readonly columnFilters: CodecColumnFiltersState;
  readonly options: CodecOptions;
}

export interface WriteFilterPartsInput {
  readonly encodedSearch: Record<string, EncodedSearchValue>;
  readonly urlParam: string;
  readonly parts: EncodedFilterParts;
  readonly urlNamespace: string | undefined;
}

export interface ReadFilterPartsInput {
  readonly search: SearchRecord;
  readonly descriptor: FieldDescriptor;
  readonly urlNamespace: string | undefined;
}

export interface ReadKeyedFilterPartsInput {
  readonly search: SearchRecord;
  readonly urlParam: string;
  readonly urlNamespace: string | undefined;
}
