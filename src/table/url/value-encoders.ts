import { DATE_RANGE_BOUNDARY } from "@table/filters/date-range-filter/date-range-boundary.constants";
import { NUMBER_RANGE_BOUNDARY } from "@table/filters/number-range-filter/number-range-boundary.constants";
import {
  parseBooleanFilterValue,
  parseDateRangeFilterValue,
  parseNumberRangeFilterValue,
  parseTagsFilterValue,
  parseTextFilterValue,
} from "@table/filters/parse-filter-value";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";

import { BOOLEAN_URL_VALUE } from "./boolean-url.constants";

import type {
  BooleanFilterValue,
  DateRangeFilterValue,
  EnumFilterValue,
  NumberRangeFilterValue,
  TagsFilterValue,
} from "@table/filters/filter-values.types";
import type { FieldDescriptor } from "@table/schema/index";

export interface EncodedFilterParts {
  readonly value?: string | boolean;
  readonly min?: number;
  readonly max?: number;
  readonly from?: string;
  readonly to?: string;
}

export function encodeFilterValue(value: unknown, descriptor: FieldDescriptor): EncodedFilterParts {
  switch (descriptor.kind) {
    case FIELD_KINDS.TEXT:
    case FIELD_KINDS.ENUM:
      return encodeScalarString(value);
    case FIELD_KINDS.BOOLEAN:
      return encodeBoolean(value);
    case FIELD_KINDS.TAGS:
      return encodeTags(value);
    case FIELD_KINDS.NUMERIC:
      return encodeNumberRange(value);
    case FIELD_KINDS.DATE:
      return encodeDateRange(value);
  }
}

function encodeScalarString(value: unknown): EncodedFilterParts {
  const parsed = parseTextFilterValue(value);
  return parsed !== undefined && parsed !== "" ? { value: parsed } : {};
}

function encodeBoolean(value: unknown): EncodedFilterParts {
  const parsed = parseBooleanFilterValue(value);
  if (parsed === true) return { value: true };
  if (parsed === false) return { value: false };
  return {};
}

function encodeTags(value: unknown): EncodedFilterParts {
  const parsed = parseTagsFilterValue(value);
  if (parsed !== undefined) {
    return parsed.length > 0 ? { value: parsed.join(",") } : {};
  }
  if (!Array.isArray(value) || value.length === 0) return {};
  const strings = value.filter((entry): entry is string => typeof entry === "string");
  return strings.length > 0 ? { value: strings.join(",") } : {};
}

function encodeNumberRange(value: unknown): EncodedFilterParts {
  const parsed = parseNumberRangeFilterValue(value);
  if (parsed === undefined) return {};
  return {
    ...(parsed.min !== undefined ? { [NUMBER_RANGE_BOUNDARY.MINIMUM]: parsed.min } : {}),
    ...(parsed.max !== undefined ? { [NUMBER_RANGE_BOUNDARY.MAXIMUM]: parsed.max } : {}),
  };
}

function encodeDateRange(value: unknown): EncodedFilterParts {
  const parsed = parseDateRangeFilterValue(value);
  if (parsed === undefined) return {};
  return {
    ...(parsed.from !== undefined ? { [DATE_RANGE_BOUNDARY.FROM]: parsed.from } : {}),
    ...(parsed.to !== undefined ? { [DATE_RANGE_BOUNDARY.TO]: parsed.to } : {}),
  };
}

export function decodeFilterValue(parts: EncodedFilterParts, descriptor: FieldDescriptor): unknown {
  switch (descriptor.kind) {
    case FIELD_KINDS.TEXT:
      return decodeText(parts.value);
    case FIELD_KINDS.ENUM:
      return decodeEnum(parts.value, descriptor.options);
    case FIELD_KINDS.BOOLEAN:
      return decodeBoolean(parts.value);
    case FIELD_KINDS.TAGS:
      return decodeTags(parts.value, descriptor.options);
    case FIELD_KINDS.NUMERIC:
      return decodeNumberRange(parts);
    case FIELD_KINDS.DATE:
      return decodeDateRange(parts);
  }
}

type ScalarInput = string | boolean | undefined;

function decodeText(inputValue: ScalarInput): string | undefined {
  const parsed = parseTextFilterValue(inputValue);
  return parsed !== undefined && parsed !== "" ? parsed : undefined;
}

function decodeEnum(
  inputValue: ScalarInput,
  options: readonly string[],
): EnumFilterValue | undefined {
  const parsed = parseTextFilterValue(inputValue);
  if (parsed === undefined || parsed === "") return undefined;
  return options.includes(parsed) ? parsed : undefined;
}

function decodeBoolean(inputValue: ScalarInput): BooleanFilterValue | undefined {
  if (
    inputValue === true ||
    inputValue === BOOLEAN_URL_VALUE.ONE ||
    inputValue === BOOLEAN_URL_VALUE.TRUE
  ) {
    return parseBooleanFilterValue(true);
  }
  if (
    inputValue === false ||
    inputValue === BOOLEAN_URL_VALUE.ZERO ||
    inputValue === BOOLEAN_URL_VALUE.FALSE
  ) {
    return parseBooleanFilterValue(false);
  }
  return undefined;
}

function decodeTags(
  inputValue: ScalarInput,
  options: readonly string[],
): TagsFilterValue | undefined {
  const parsed = parseTextFilterValue(inputValue);
  if (parsed === undefined || parsed === "") return undefined;
  const parts = parsed
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
  const valid = parts.filter((entry) => options.includes(entry));
  const tags = parseTagsFilterValue(valid);
  return tags !== undefined && tags.length > 0 ? tags : undefined;
}

function decodeNumberRange(parts: EncodedFilterParts): NumberRangeFilterValue | undefined {
  return parseNumberRangeFilterValue({
    [NUMBER_RANGE_BOUNDARY.MINIMUM]: parts.min,
    [NUMBER_RANGE_BOUNDARY.MAXIMUM]: parts.max,
  });
}

function decodeDateRange(parts: EncodedFilterParts): DateRangeFilterValue | undefined {
  return parseDateRangeFilterValue({
    [DATE_RANGE_BOUNDARY.FROM]: parts.from,
    [DATE_RANGE_BOUNDARY.TO]: parts.to,
  });
}
