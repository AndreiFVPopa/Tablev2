import { isPlainRecord } from "@table/lib/is-plain-record";

import { DIAGNOSTIC_CODES } from "./diagnostic-codes.constants";
import { tableFieldMetaSchema } from "./field-meta.schema";
import { tryUnwrap } from "./unwrap-schema";
import { URL_VALUE_ENCODINGS } from "./url-value-encoding.constants";
import { MAX_SCHEMA_WRAPPER_DEPTH } from "./wrapper-depth.constants";

import type { DiagnosticIssue, ResolvedFieldMeta } from "./descriptors";
import type { TableFieldMeta } from "./field-meta.schema";
import type { UrlValueEncoding } from "./url-value-encoding.constants";
import type { z } from "zod";

interface MutableFieldMeta {
  title: string | undefined;
  description: string | undefined;
  deprecated: boolean | undefined;
  hidden: boolean | undefined;
  urlParam: string | undefined;
  urlValueEncoding: UrlValueEncoding | undefined;
  urlSlugOverrides: Readonly<Record<string, string>> | undefined;
  optionLabels: Readonly<Record<string, string>> | undefined;
}

interface MetaAssignTarget {
  readonly merged: MutableFieldMeta;
  readonly path: string;
  readonly diagnostics: DiagnosticIssue[];
}

export function resolveFieldMeta(
  schema: z.ZodType,
  segments: readonly string[],
  diagnostics: DiagnosticIssue[],
): ResolvedFieldMeta {
  const path = segments.join(".");
  const merged: MutableFieldMeta = {
    title: undefined,
    description: undefined,
    deprecated: undefined,
    hidden: undefined,
    urlParam: undefined,
    urlValueEncoding: undefined,
    urlSlugOverrides: undefined,
    optionLabels: undefined,
  };

  for (const layer of collectMetaLayersInnerToOuter(schema)) {
    applyMetaLayer(merged, layer, path, diagnostics);
  }

  return {
    title: merged.title ?? segments.at(-1) ?? "",
    description: merged.description,
    deprecated: merged.deprecated ?? false,
    hidden: merged.hidden ?? false,
    urlParam: merged.urlParam,
    urlValueEncoding: merged.urlValueEncoding ?? URL_VALUE_ENCODINGS.CANONICAL,
    urlSlugOverrides: merged.urlSlugOverrides,
    optionLabels: merged.optionLabels,
  };
}

function collectMetaLayersInnerToOuter(schema: z.ZodType): readonly unknown[] {
  const layers: unknown[] = [];
  let current: z.ZodType | undefined = schema;
  for (let depth = 0; current && depth < MAX_SCHEMA_WRAPPER_DEPTH; depth += 1) {
    const meta = current.meta();
    if (meta !== undefined) {
      layers.unshift(meta);
    }
    current = tryUnwrap(current);
  }
  return layers;
}

function applyMetaLayer(
  merged: MutableFieldMeta,
  layer: unknown,
  path: string,
  diagnostics: DiagnosticIssue[],
): void {
  if (!isPlainRecord(layer)) {
    pushInvalidMeta(diagnostics, path, "meta", "expected a plain object from .meta({ ... })");
    return;
  }

  const target: MetaAssignTarget = { merged, path, diagnostics };
  assignOptionalNonEmptyString(target, "title", layer.title);
  assignOptionalNonEmptyString(target, "description", layer.description);
  assignOptionalBoolean(target, "deprecated", layer.deprecated);

  if (layer.table === undefined) return;
  if (!isPlainRecord(layer.table)) {
    pushInvalidMeta(diagnostics, path, "table", "expected a plain object");
    return;
  }
  applyTableMeta(merged, layer.table, path, diagnostics);
}

function applyTableMeta(
  merged: MutableFieldMeta,
  table: Readonly<Record<string, unknown>>,
  path: string,
  diagnostics: DiagnosticIssue[],
): void {
  const parsed = tableFieldMetaSchema.safeParse(table);
  if (parsed.success) {
    overlayTableMeta(merged, parsed.data);
    return;
  }
  applyTableMetaFieldByField(merged, table, path, diagnostics);
}

function applyTableMetaFieldByField(
  merged: MutableFieldMeta,
  table: Readonly<Record<string, unknown>>,
  path: string,
  diagnostics: DiagnosticIssue[],
): void {
  const target: MetaAssignTarget = { merged, path, diagnostics };
  assignOptionalBoolean(target, "hidden", table.hidden, "table.hidden");
  assignOptionalNonEmptyString(target, "urlParam", table.urlParam, "table.urlParam");
  assignOptionalUrlValueEncoding(target, table.urlValueEncoding);

  const overrides = readStringRecord(
    table.urlSlugOverrides,
    path,
    "table.urlSlugOverrides",
    diagnostics,
  );
  if (overrides !== undefined) merged.urlSlugOverrides = overrides;

  const labels = readStringRecord(table.optionLabels, path, "table.optionLabels", diagnostics);
  if (labels !== undefined) merged.optionLabels = labels;
}

function overlayTableMeta(merged: MutableFieldMeta, table: TableFieldMeta): void {
  if (table.hidden !== undefined) merged.hidden = table.hidden;
  if (table.urlParam !== undefined) merged.urlParam = table.urlParam;
  if (table.urlValueEncoding !== undefined) merged.urlValueEncoding = table.urlValueEncoding;
  if (table.urlSlugOverrides !== undefined) merged.urlSlugOverrides = table.urlSlugOverrides;
  if (table.optionLabels !== undefined) merged.optionLabels = table.optionLabels;
}

function assignOptionalNonEmptyString(
  target: MetaAssignTarget,
  field: "title" | "description" | "urlParam",
  value: unknown,
  diagnosticKey: string = field,
): void {
  const parsed = readNonEmptyString(value);
  if (parsed !== undefined) {
    target.merged[field] = parsed;
    return;
  }
  if (value !== undefined) {
    pushInvalidMeta(target.diagnostics, target.path, diagnosticKey, "expected a non-empty string");
  }
}

function assignOptionalBoolean(
  target: MetaAssignTarget,
  field: "deprecated" | "hidden",
  value: unknown,
  diagnosticKey: string = field,
): void {
  if (typeof value === "boolean") {
    target.merged[field] = value;
    return;
  }
  if (value !== undefined) {
    pushInvalidMeta(target.diagnostics, target.path, diagnosticKey, "expected a boolean");
  }
}

function assignOptionalUrlValueEncoding(target: MetaAssignTarget, value: unknown): void {
  if (
    value === URL_VALUE_ENCODINGS.CANONICAL ||
    value === URL_VALUE_ENCODINGS.POSITIONAL ||
    value === URL_VALUE_ENCODINGS.SLUG
  ) {
    target.merged.urlValueEncoding = value;
    return;
  }
  if (value !== undefined) {
    pushInvalidMeta(
      target.diagnostics,
      target.path,
      "table.urlValueEncoding",
      'expected "canonical", "positional", or "slug"',
    );
  }
}

function readStringRecord(
  value: unknown,
  path: string,
  key: string,
  diagnostics: DiagnosticIssue[],
): Readonly<Record<string, string>> | undefined {
  if (value === undefined) return undefined;
  if (!isPlainRecord(value)) {
    pushInvalidMeta(diagnostics, path, key, "expected a string record");
    return undefined;
  }
  const record: Record<string, string> = {};
  let hasEntry = false;
  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (typeof entryValue === "string" && entryValue !== "") {
      record[entryKey] = entryValue;
      hasEntry = true;
      continue;
    }
    pushInvalidMeta(diagnostics, path, `${key}.${entryKey}`, "expected a non-empty string value");
  }
  return hasEntry ? record : undefined;
}

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function pushInvalidMeta(
  diagnostics: DiagnosticIssue[],
  path: string,
  key: string,
  detail: string,
): void {
  diagnostics.push({
    code: DIAGNOSTIC_CODES.INVALID_FIELD_META,
    path,
    message: `Field "${path}" has invalid metadata at "${key}": ${detail}.`,
    hint: "Fix or remove the invalid metadata entry; valid values from other wrappers still apply.",
  });
}
