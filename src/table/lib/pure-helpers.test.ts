import { describe, expect, it } from "vitest";
import { z } from "zod";

import { interpretSchema } from "../schema/index";
import { DEFAULT_LABELS } from "../table-labels";

import { formatValue } from "./format-value";
import { getValueAtPath } from "./get-value-at-path";
import { DEFAULT_PAGE_SIZE, resolveDefaultPageSize } from "./page-sizes";
import { createDefaultTableState } from "./table-state";

import type { FieldDescriptor, FieldKind } from "../schema/index";
const FIXTURE_SCHEMA = z.object({
  name: z.string(),
  score: z.number(),
  active: z.boolean(),
  status: z.enum(["new", "done"]),
  created: z.date(),
  tags: z.array(z.enum(["a", "b", "c"])),
});
function descriptor(kind: FieldKind): FieldDescriptor {
  const { fields } = interpretSchema(FIXTURE_SCHEMA);
  const found = fields.find((f) => f.kind === kind);
  if (!found) throw new Error(`fixture missing kind ${kind}`);
  return found;
}
describe("getValueAtPath", () => {
  const row = { firstName: "Ana", address: { city: "Cluj", geo: { lat: 46 } } };
  it("reads top-level fields", () => {
    expect(getValueAtPath(row, ["firstName"])).toBe("Ana");
  });
  it("reads nested dotted paths", () => {
    expect(getValueAtPath(row, ["address", "city"])).toBe("Cluj");
    expect(getValueAtPath(row, ["address", "geo", "lat"])).toBe(46);
  });
  it("returns undefined when the chain terminates early", () => {
    expect(getValueAtPath(row, ["address", "zip"])).toBeUndefined();
    expect(getValueAtPath(row, ["missing", "x"])).toBeUndefined();
  });
  it("returns undefined for null / primitive midway segments", () => {
    expect(getValueAtPath({ a: null }, ["a", "b"])).toBeUndefined();
    expect(getValueAtPath({ a: 5 }, ["a", "b"])).toBeUndefined();
  });
  it("does not descend into arrays", () => {
    expect(getValueAtPath({ tags: ["x"] }, ["tags", "0"])).toBeUndefined();
  });
});
describe("formatValue", () => {
  it("formats text", () => {
    const d = descriptor("text");
    expect(formatValue("Ana", d, DEFAULT_LABELS)).toBe("Ana");
    expect(formatValue("", d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
    expect(formatValue(null, d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
  });
  it("formats numbers with ro-RO locale", () => {
    const d = descriptor("numeric");
    expect(formatValue(1234, d, DEFAULT_LABELS)).toMatch(/1[.\s]234/u);
    expect(formatValue(Number.NaN, d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
    expect(formatValue("5", d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
  });
  it("formats booleans with Romanian Da/Nu", () => {
    const d = descriptor("boolean");
    expect(formatValue(true, d, DEFAULT_LABELS)).toBe("Da");
    expect(formatValue(false, d, DEFAULT_LABELS)).toBe("Nu");
    expect(formatValue(null, d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
  });
  it("formats enum as the raw string", () => {
    const d = descriptor("enum");
    expect(formatValue("done", d, DEFAULT_LABELS)).toBe("done");
    expect(formatValue(null, d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
  });
  it("formats dates with ro-RO locale and rejects invalid ones", () => {
    const d = descriptor("date");
    expect(formatValue(new Date("2026-11-13T12:00:00Z"), d, DEFAULT_LABELS)).toMatch(/\d/u);
    expect(formatValue(new Date("invalid"), d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
    expect(formatValue("2026-11-13", d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
  });
  it("joins tags with comma, drops non-strings, falls back to empty", () => {
    const d = descriptor("tags");
    expect(formatValue(["a", "b"], d, DEFAULT_LABELS)).toBe("a, b");
    expect(formatValue([], d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
    expect(formatValue([1, 2], d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
    expect(formatValue("nope", d, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.cellEmpty);
  });
});
describe("createDefaultTableState", () => {
  it("returns sensible defaults", () => {
    const s = createDefaultTableState();
    expect(s.pagination.pageIndex).toBe(0);
    expect(s.pagination.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(s.sorting).toEqual([]);
    expect(s.columnFilters).toEqual([]);
  });
  it("accepts partial overrides for each slice", () => {
    const s = createDefaultTableState({
      pagination: { pageIndex: 2, pageSize: 50 },
      sorting: [{ id: "name", desc: true }],
      columnFilters: [{ id: "status", value: "done" }],
    });
    expect(s.pagination).toEqual({ pageIndex: 2, pageSize: 50 });
    expect(s.sorting).toEqual([{ id: "name", desc: true }]);
    expect(s.columnFilters).toEqual([{ id: "status", value: "done" }]);
  });
});

describe("resolveDefaultPageSize", () => {
  it("prefers DEFAULT_PAGE_SIZE when it is in the allowed list", () => {
    expect(resolveDefaultPageSize([10, 25, 50, 100])).toBe(DEFAULT_PAGE_SIZE);
  });

  it("falls back to the first allowed size otherwise", () => {
    expect(resolveDefaultPageSize([1, 2, 10])).toBe(1);
  });
});
