import { FIELD_KINDS } from "@table/schema/field-kinds.constants";

import type { FieldDescriptor } from "@table/schema/index";
import type { TableLabels } from "@table/table-labels";

const TABLE_LOCALE = "ro-RO" as const;

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
  return typeof value === "string" && value.length > 0 ? value : labels.cellEmpty;
}

function formatNumber(value: unknown, labels: TableLabels): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString(TABLE_LOCALE)
    : labels.cellEmpty;
}

function formatBoolean(value: unknown, labels: TableLabels): string {
  if (value === true) return labels.cellBooleanTrue;
  if (value === false) return labels.cellBooleanFalse;
  return labels.cellEmpty;
}

function formatDate(value: unknown, labels: TableLabels): string {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toLocaleDateString(TABLE_LOCALE)
    : labels.cellEmpty;
}

function formatTags(value: unknown, labels: TableLabels): string {
  if (!Array.isArray(value) || value.length === 0) return labels.cellEmpty;
  const strings = value.filter((entry): entry is string => typeof entry === "string");
  return strings.length > 0 ? strings.join(", ") : labels.cellEmpty;
}
