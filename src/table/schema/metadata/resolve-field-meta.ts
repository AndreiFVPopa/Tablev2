import { isPlainRecord } from "@table/lib/is-plain-record";

import { DIAGNOSTIC_CODES } from "../diagnostic-codes.constants";
import { tryUnwrap } from "../unwrap-schema";
import { URL_VALUE_ENCODINGS } from "../url-value-encoding.constants";
import { MAX_SCHEMA_WRAPPER_DEPTH } from "../wrapper-depth.constants";

import { fieldPresentationMetaSchema, tableFieldMetaSchema } from "./field-meta.schema";

import type { ResolvedFieldMeta } from "../descriptors";
import type { TableFieldMeta } from "./field-meta.schema";
import type {
  ApplyMetaLayerInput,
  ApplyOptionalBooleanInput,
  ApplyOptionalStringInput,
  MutableFieldMeta,
  PushInvalidMetaInput,
  PushZodIssuesInput,
  ResolveFieldMetaInput,
} from "./resolve-field-meta.types";
import type { z } from "zod";

export function resolveFieldMeta({
  schema,
  segments,
  diagnostics,
}: ResolveFieldMetaInput): ResolvedFieldMeta {
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
    applyMetaLayer({ merged, layer, path, diagnostics });
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
    if (meta !== undefined) layers.unshift(meta);
    current = tryUnwrap(current);
  }
  return layers;
}

function applyMetaLayer({ merged, layer, path, diagnostics }: ApplyMetaLayerInput): void {
  if (!isPlainRecord(layer)) {
    pushInvalidMeta({
      diagnostics,
      path,
      key: "meta",
      detail: "expected a plain object from .meta({ ... })",
    });
    return;
  }

  applyOptionalString({ merged, key: "title", value: layer.title, path, diagnostics });
  applyOptionalString({
    merged,
    key: "description",
    value: layer.description,
    path,
    diagnostics,
  });
  applyOptionalBoolean({ merged, value: layer.deprecated, path, diagnostics });
  if (layer.table === undefined) return;

  const parsed = tableFieldMetaSchema.safeParse(layer.table);
  if (!parsed.success) {
    pushZodIssues({ diagnostics, path, prefix: "table", error: parsed.error });
    return;
  }
  overlayTableMeta(merged, parsed.data);
}

function applyOptionalString({
  merged,
  key,
  value,
  path,
  diagnostics,
}: ApplyOptionalStringInput): void {
  if (value === undefined) return;
  const parsed = parsePresentationString(key, value);
  if (!parsed.success) {
    pushZodIssues({ diagnostics, path, prefix: key, error: parsed.error });
    return;
  }
  merged[key] = parsed.data;
}

function parsePresentationString(
  key: "title" | "description",
  value: unknown,
): z.ZodSafeParseResult<string> {
  if (key === "title") {
    return fieldPresentationMetaSchema.shape.title.unwrap().safeParse(value);
  }
  return fieldPresentationMetaSchema.shape.description.unwrap().safeParse(value);
}

function applyOptionalBoolean({
  merged,
  value,
  path,
  diagnostics,
}: ApplyOptionalBooleanInput): void {
  if (value === undefined) return;
  const parsed = fieldPresentationMetaSchema.shape.deprecated.unwrap().safeParse(value);
  if (!parsed.success) {
    pushZodIssues({ diagnostics, path, prefix: "deprecated", error: parsed.error });
    return;
  }
  merged.deprecated = parsed.data;
}

function overlayTableMeta(merged: MutableFieldMeta, table: TableFieldMeta): void {
  if (table.hidden !== undefined) merged.hidden = table.hidden;
  if (table.urlParam !== undefined) merged.urlParam = table.urlParam;
  if (table.urlValueEncoding !== undefined) merged.urlValueEncoding = table.urlValueEncoding;
  if (table.urlSlugOverrides !== undefined) merged.urlSlugOverrides = table.urlSlugOverrides;
  if (table.optionLabels !== undefined) merged.optionLabels = table.optionLabels;
}

function pushZodIssues({ diagnostics, path, prefix, error }: PushZodIssuesInput): void {
  for (const issue of error.issues) {
    const suffix = issue.path.map(String).join(".");
    const key = suffix === "" ? prefix : `${prefix}.${suffix}`;
    pushInvalidMeta({ diagnostics, path, key, detail: issue.message });
  }
}

function pushInvalidMeta({ diagnostics, path, key, detail }: PushInvalidMetaInput): void {
  diagnostics.push({
    code: DIAGNOSTIC_CODES.INVALID_FIELD_META,
    path,
    message: `Field "${path}" has invalid metadata at "${key}": ${detail}.`,
    hint: "Fix or remove the invalid metadata object. Valid metadata from other wrappers still applies.",
  });
}
