import { isPlainRecord } from "@table/lib/is-plain-record";

import { tryUnwrap } from "./unwrap-schema";
import { MAX_SCHEMA_WRAPPER_DEPTH } from "./wrapper-depth.constants";

import type { ResolvedFieldMeta } from "./descriptors";
import type { z } from "zod";

export function resolveFieldMeta(
  schema: z.ZodType,
  segments: readonly string[],
): ResolvedFieldMeta {
  const metaChain = walkMetaChain(schema);
  const lastSegment = segments.at(-1) ?? "";
  return {
    title: pickString(metaChain, "title") ?? lastSegment,
    description: pickString(metaChain, "description"),
    deprecated: pickBoolean(metaChain, "deprecated") ?? false,
    hidden: Boolean(pickTableFlag(metaChain, "hidden")),
  };
}

function walkMetaChain(schema: z.ZodType): readonly Record<string, unknown>[] {
  const chain: Record<string, unknown>[] = [];
  let current: z.ZodType | undefined = schema;
  for (let depth = 0; current && depth < MAX_SCHEMA_WRAPPER_DEPTH; depth += 1) {
    const meta = current.meta();
    if (meta) {
      chain.unshift(meta);
    }
    current = tryUnwrap(current);
  }
  return chain;
}

function pickString(
  chain: readonly Record<string, unknown>[],
  key: "title" | "description",
): string | undefined {
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const value = chain[i]?.[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function pickBoolean(
  chain: readonly Record<string, unknown>[],
  key: "deprecated",
): boolean | undefined {
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const value = chain[i]?.[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function pickTableFlag(
  chain: readonly Record<string, unknown>[],
  key: "hidden",
): boolean | undefined {
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const table = chain[i]?.table;
    if (!isPlainRecord(table)) continue;
    const value = table[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}
