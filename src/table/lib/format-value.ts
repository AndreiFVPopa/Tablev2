import { FIELD_KINDS } from "@table/schema/field-kinds.constants";

import type { FieldDescriptor } from "@table/schema/index";
import type { TableLabels } from "@table/table-labels";

export const TABLE_LOCALE = "ro-RO" as const;

const numberFormatter = new Intl.NumberFormat(TABLE_LOCALE);
const dateFormatter = new Intl.DateTimeFormat(TABLE_LOCALE, {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export function formatValue(
  value: unknown,
  descriptor: FieldDescriptor,
  labels: TableLabels,
): string {
  switch (descriptor.kind) {
    case FIELD_KINDS.TEXT:
    case FIELD_KINDS.ENUM:
      return formatString(value, labels);
    case FIELD_KINDS.NUMERIC:
      return formatNumber(value, labels);
    case FIELD_KINDS.BOOLEAN:
      return formatBoolean(value, labels);
    case FIELD_KINDS.DATE:
      return formatDate(value, labels);
    case FIELD_KINDS.TAGS:
      return formatTags(value, labels);
  }
}

function formatString(value: unknown, labels: TableLabels): string {
  const normalized = normalizeNonEmptyString(value);
  return normalized ?? labels.cellEmpty;
}

function formatNumber(value: unknown, labels: TableLabels): string {
  const normalized = normalizeFiniteNumber(value);
  return normalized === undefined ? labels.cellEmpty : numberFormatter.format(normalized);
}

function formatBoolean(value: unknown, labels: TableLabels): string {
  if (value === true) return labels.cellBooleanTrue;
  if (value === false) return labels.cellBooleanFalse;
  return labels.cellEmpty;
}

function formatDate(value: unknown, labels: TableLabels): string {
  const normalized = normalizeValidDate(value);
  return normalized === undefined ? labels.cellEmpty : dateFormatter.format(normalized);
}

function formatTags(value: unknown, labels: TableLabels): string {
  const normalized = normalizeStringList(value);
  return normalized === undefined ? labels.cellEmpty : normalized.join(", ");
}

function normalizeNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function normalizeFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeValidDate(value: unknown): Date | undefined {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : undefined;
}

function normalizeStringList(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const strings = value.filter((entry): entry is string => typeof entry === "string");
  return strings.length > 0 ? strings : undefined;
}
