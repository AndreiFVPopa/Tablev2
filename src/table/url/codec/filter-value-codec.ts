import { DATE_RANGE_BOUNDARY } from "@table/filters/date-range-filter/date-range-boundary.constants";
import { NUMBER_RANGE_BOUNDARY } from "@table/filters/number-range-filter/number-range-boundary.constants";
import {
  parseDateRangeFilterValue,
  parseNumberRangeFilterValue,
  parseTagsFilterValue,
  parseTextFilterValue,
} from "@table/filters/shared/parse-filter-value";
import { BOOLEAN_CANONICAL_OPTIONS } from "@table/schema/encoding/option-encoding-config";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";
import { URL_VALUE_ENCODINGS } from "@table/schema/url-value-encoding.constants";

import { fieldUrlParam, filterKey } from "../search-keys/search-keys";

import {
  decodeDescriptorOption,
  decodeOptionFromUrlToken,
  encodeDescriptorOption,
  encodeOptionToUrlToken,
} from "./option-encoding";
import { coerceFiniteNumber, coerceString } from "./search-values";

import type { CodecColumnFiltersState, CodecOptions, SearchRecord } from "./codec.types";
import type {
  EncodedFilterParts,
  ReadFilterPartsInput,
  ReadKeyedFilterPartsInput,
  WriteEncodedFiltersInput,
  WriteFilterPartsInput,
} from "./filter-value-codec.types";
import type {
  BooleanFilterValue,
  DateRangeFilterValue,
  EnumFilterValue,
  NumberRangeFilterValue,
  TagsFilterValue,
} from "@table/filters/shared/filter-values.types";
import type {
  BooleanFieldDescriptor,
  EnumFieldDescriptor,
  FieldDescriptor,
  TagsFieldDescriptor,
} from "@table/schema/descriptors";

type ScalarSearchInput = string | number | boolean | undefined;

export function writeEncodedFilters({
  encodedSearch,
  columnFilters,
  options,
}: WriteEncodedFiltersInput): void {
  const filterValueById = new Map(columnFilters.map((filter) => [filter.id, filter.value]));
  for (const descriptor of options.fields) {
    const filterValue = filterValueById.get(descriptor.path);
    if (filterValue === undefined) continue;
    const parts = encodeFilterValue(filterValue, descriptor);
    writeFilterParts({
      encodedSearch,
      urlParam: fieldUrlParam(descriptor),
      parts,
      urlNamespace: options.urlNamespace,
    });
  }
}

export function readEncodedFilters(
  search: SearchRecord,
  options: CodecOptions,
): CodecColumnFiltersState {
  const columnFilters: { id: string; value: unknown }[] = [];
  for (const descriptor of options.fields) {
    const parts = readFilterParts({ search, descriptor, urlNamespace: options.urlNamespace });
    const filterValue = decodeFilterValue(parts, descriptor);
    if (filterValue !== undefined) {
      columnFilters.push({ id: descriptor.path, value: filterValue });
    }
  }
  return columnFilters;
}

function encodeFilterValue(value: unknown, descriptor: FieldDescriptor): EncodedFilterParts {
  switch (descriptor.kind) {
    case FIELD_KINDS.TEXT:
      return encodeTextFilter(value);
    case FIELD_KINDS.ENUM:
      return encodeEnumFilter(value, descriptor);
    case FIELD_KINDS.BOOLEAN:
      return encodeBooleanFilter(value, descriptor);
    case FIELD_KINDS.TAGS:
      return encodeTagsFilter(value, descriptor);
    case FIELD_KINDS.NUMERIC:
      return encodeNumberRangeFilter(value);
    case FIELD_KINDS.DATE:
      return encodeDateRangeFilter(value);
  }
}

function decodeFilterValue(parts: EncodedFilterParts, descriptor: FieldDescriptor): unknown {
  switch (descriptor.kind) {
    case FIELD_KINDS.TEXT:
      return decodeTextFilter(parts.value);
    case FIELD_KINDS.ENUM:
      return decodeEnumFilter(parts.value, descriptor);
    case FIELD_KINDS.BOOLEAN:
      return decodeBooleanFilter(parts.value, descriptor);
    case FIELD_KINDS.TAGS:
      return decodeTagsFilter(parts.value, descriptor);
    case FIELD_KINDS.NUMERIC:
      return decodeNumberRangeFilter(parts);
    case FIELD_KINDS.DATE:
      return decodeDateRangeFilter(parts);
  }
}

function encodeTextFilter(value: unknown): EncodedFilterParts {
  const parsed = parseTextFilterValue(value);
  return parsed !== undefined && parsed !== "" ? { value: parsed } : {};
}

function encodeEnumFilter(value: unknown, descriptor: EnumFieldDescriptor): EncodedFilterParts {
  const parsed = parseTextFilterValue(value);
  if (parsed === undefined || parsed === "") return {};
  const token = encodeDescriptorOption(parsed, descriptor);
  if (token === undefined) return {};
  if (descriptor.meta.urlValueEncoding === URL_VALUE_ENCODINGS.POSITIONAL) {
    return { value: Number(token) };
  }
  return { value: token };
}

function encodeBooleanFilter(
  value: unknown,
  descriptor: BooleanFieldDescriptor,
): EncodedFilterParts {
  if (value !== true && value !== false) return {};
  if (descriptor.meta.urlValueEncoding !== URL_VALUE_ENCODINGS.POSITIONAL) {
    return { value };
  }
  const token = encodeOptionToUrlToken({
    canonicalOption: value ? BOOLEAN_CANONICAL_OPTIONS[0] : BOOLEAN_CANONICAL_OPTIONS[1],
    optionValues: BOOLEAN_CANONICAL_OPTIONS,
    encoding: URL_VALUE_ENCODINGS.POSITIONAL,
  });
  return token === undefined ? {} : { value: Number(token) };
}

function encodeTagsFilter(value: unknown, descriptor: TagsFieldDescriptor): EncodedFilterParts {
  const canonicalTags = parseTagsFilterValue(value);
  if (canonicalTags === undefined || canonicalTags.length === 0) return {};
  const tokens: string[] = [];
  for (const tag of canonicalTags) {
    const token = encodeDescriptorOption(tag, descriptor);
    if (token !== undefined) tokens.push(token);
  }
  return tokens.length > 0 ? { value: tokens.join(",") } : {};
}

function encodeNumberRangeFilter(value: unknown): EncodedFilterParts {
  const parsed = parseNumberRangeFilterValue(value);
  if (parsed === undefined) return {};
  const parts: { min?: number; max?: number } = {};
  if (parsed.min !== undefined) parts.min = parsed.min;
  if (parsed.max !== undefined) parts.max = parsed.max;
  return parts;
}

function encodeDateRangeFilter(value: unknown): EncodedFilterParts {
  const parsed = parseDateRangeFilterValue(value);
  if (parsed === undefined) return {};
  const parts: { from?: string; to?: string } = {};
  if (parsed.from !== undefined) parts.from = parsed.from;
  if (parsed.to !== undefined) parts.to = parsed.to;
  return parts;
}

function decodeTextFilter(inputValue: ScalarSearchInput): string | undefined {
  const parsed = parseTextFilterValue(coerceString(inputValue));
  return parsed !== undefined && parsed !== "" ? parsed : undefined;
}

function decodeEnumFilter(
  inputValue: ScalarSearchInput,
  descriptor: EnumFieldDescriptor,
): EnumFilterValue | undefined {
  const token = coerceString(inputValue);
  if (token === undefined || token === "") return undefined;
  return decodeDescriptorOption(token, descriptor);
}

function decodeBooleanFilter(
  inputValue: ScalarSearchInput,
  descriptor: BooleanFieldDescriptor,
): BooleanFilterValue | undefined {
  if (typeof inputValue === "boolean") return inputValue;
  const token = coerceString(inputValue);
  if (token === undefined || token === "") return undefined;
  return booleanFromOption(
    decodeOptionFromUrlToken({
      urlToken: token,
      optionValues: BOOLEAN_CANONICAL_OPTIONS,
      encoding: descriptor.meta.urlValueEncoding,
    }),
  );
}

function booleanFromOption(option: string | undefined): BooleanFilterValue | undefined {
  if (option === BOOLEAN_CANONICAL_OPTIONS[0]) return true;
  if (option === BOOLEAN_CANONICAL_OPTIONS[1]) return false;
  return undefined;
}

function decodeTagsFilter(
  inputValue: ScalarSearchInput,
  descriptor: TagsFieldDescriptor,
): TagsFilterValue | undefined {
  const raw = coerceString(inputValue);
  if (raw === undefined || raw === "") return undefined;
  const knownOptions: string[] = [];
  for (const token of raw.split(",")) {
    const trimmed = token.trim();
    if (trimmed === "") continue;
    const option = decodeDescriptorOption(trimmed, descriptor);
    if (option !== undefined) knownOptions.push(option);
  }
  return knownOptions.length > 0 ? knownOptions : undefined;
}

function decodeNumberRangeFilter(parts: EncodedFilterParts): NumberRangeFilterValue | undefined {
  return parseNumberRangeFilterValue({
    [NUMBER_RANGE_BOUNDARY.MINIMUM]: parts.min,
    [NUMBER_RANGE_BOUNDARY.MAXIMUM]: parts.max,
  });
}

function decodeDateRangeFilter(parts: EncodedFilterParts): DateRangeFilterValue | undefined {
  return parseDateRangeFilterValue({
    [DATE_RANGE_BOUNDARY.FROM]: parts.from,
    [DATE_RANGE_BOUNDARY.TO]: parts.to,
  });
}

function writeFilterParts({
  encodedSearch,
  urlParam,
  parts,
  urlNamespace,
}: WriteFilterPartsInput): void {
  if (parts.value !== undefined) {
    encodedSearch[filterKey({ urlParam, urlNamespace })] = parts.value;
  }
  if (parts.min !== undefined) {
    encodedSearch[
      filterKey({
        urlParam,
        rangeSubKey: NUMBER_RANGE_BOUNDARY.MINIMUM,
        urlNamespace,
      })
    ] = parts.min;
  }
  if (parts.max !== undefined) {
    encodedSearch[
      filterKey({
        urlParam,
        rangeSubKey: NUMBER_RANGE_BOUNDARY.MAXIMUM,
        urlNamespace,
      })
    ] = parts.max;
  }
  if (parts.from !== undefined) {
    encodedSearch[filterKey({ urlParam, rangeSubKey: DATE_RANGE_BOUNDARY.FROM, urlNamespace })] =
      parts.from;
  }
  if (parts.to !== undefined) {
    encodedSearch[filterKey({ urlParam, rangeSubKey: DATE_RANGE_BOUNDARY.TO, urlNamespace })] =
      parts.to;
  }
}

function readFilterParts({
  search,
  descriptor,
  urlNamespace,
}: ReadFilterPartsInput): EncodedFilterParts {
  const urlParam = fieldUrlParam(descriptor);
  switch (descriptor.kind) {
    case FIELD_KINDS.NUMERIC:
      return readNumberRangeParts({ search, urlParam, urlNamespace });
    case FIELD_KINDS.DATE:
      return readDateRangeParts({ search, urlParam, urlNamespace });
    case FIELD_KINDS.TEXT:
    case FIELD_KINDS.ENUM:
    case FIELD_KINDS.BOOLEAN:
    case FIELD_KINDS.TAGS:
      return readScalarFilterParts({ search, urlParam, urlNamespace });
  }
}

function readNumberRangeParts({
  search,
  urlParam,
  urlNamespace,
}: ReadKeyedFilterPartsInput): EncodedFilterParts {
  const min = coerceFiniteNumber(
    search[filterKey({ urlParam, rangeSubKey: NUMBER_RANGE_BOUNDARY.MINIMUM, urlNamespace })],
  );
  const max = coerceFiniteNumber(
    search[filterKey({ urlParam, rangeSubKey: NUMBER_RANGE_BOUNDARY.MAXIMUM, urlNamespace })],
  );
  return {
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
  };
}

function readDateRangeParts({
  search,
  urlParam,
  urlNamespace,
}: ReadKeyedFilterPartsInput): EncodedFilterParts {
  const from = coerceString(
    search[filterKey({ urlParam, rangeSubKey: DATE_RANGE_BOUNDARY.FROM, urlNamespace })],
  );
  const to = coerceString(
    search[filterKey({ urlParam, rangeSubKey: DATE_RANGE_BOUNDARY.TO, urlNamespace })],
  );
  return {
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
  };
}

function readScalarFilterParts({
  search,
  urlParam,
  urlNamespace,
}: ReadKeyedFilterPartsInput): EncodedFilterParts {
  const parts: { value?: string | number | boolean } = {};
  assignScalarFilterPart(parts, search[filterKey({ urlParam, urlNamespace })]);
  return parts;
}

function assignScalarFilterPart(
  parts: { value?: string | number | boolean },
  rawValue: unknown,
): void {
  if (typeof rawValue === "boolean") {
    parts.value = rawValue;
    return;
  }
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    parts.value = rawValue;
    return;
  }
  const stringValue = coerceString(rawValue);
  if (stringValue !== undefined) {
    parts.value = stringValue;
  }
}
