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
      return formatString(value, labels);
    case FIELD_KINDS.ENUM:
      return formatLabeledOption(value, descriptor.meta.optionLabels, labels);
    case FIELD_KINDS.NUMERIC:
      return formatNumber(value, labels);
    case FIELD_KINDS.BOOLEAN:
      return formatBoolean(value, labels);
    case FIELD_KINDS.DATE:
      return formatDate(value, labels);
    case FIELD_KINDS.TAGS:
      return formatTags(value, descriptor.meta.optionLabels, labels);
  }
}

function formatString(value: unknown, labels: TableLabels): string {
  return nonEmptyString(value) ?? labels.cellEmpty;
}

function formatLabeledOption(
  value: unknown,
  optionLabels: Readonly<Record<string, string>> | undefined,
  labels: TableLabels,
): string {
  const normalized = nonEmptyString(value);
  if (normalized === undefined) return labels.cellEmpty;
  return optionLabels?.[normalized] ?? normalized;
}

function formatNumber(value: unknown, labels: TableLabels): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return labels.cellEmpty;
  return numberFormatter.format(value);
}

function formatBoolean(value: unknown, labels: TableLabels): string {
  if (value === true) return labels.cellBooleanTrue;
  if (value === false) return labels.cellBooleanFalse;
  return labels.cellEmpty;
}

function formatDate(value: unknown, labels: TableLabels): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return labels.cellEmpty;
  return dateFormatter.format(value);
}

function formatTags(
  value: unknown,
  optionLabels: Readonly<Record<string, string>> | undefined,
  labels: TableLabels,
): string {
  if (!Array.isArray(value) || value.length === 0) return labels.cellEmpty;
  const labelsForTags = value
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    .map((tag) => optionLabels?.[tag] ?? tag);
  return labelsForTags.length > 0 ? labelsForTags.join(", ") : labels.cellEmpty;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
