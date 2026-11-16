import { describe, expect, it } from "vitest";

import { textFilterValueSchema } from "./filter-values.schema";
import {
  parseBooleanFilterValue,
  parseDateRangeFilterValue,
  parseEnumFilterValue,
  parseFilterValue,
  parseNumberRangeFilterValue,
  parseTagsFilterValue,
  parseTextFilterValue,
} from "./parse-filter-value";

describe("parseFilterValue", () => {
  it("returns schema output on success and undefined on failure", () => {
    expect(parseFilterValue(textFilterValueSchema, "ana")).toBe("ana");
    expect(parseFilterValue(textFilterValueSchema, 1)).toBeUndefined();
  });
});

describe("parse-filter-value — text", () => {
  it("accepts strings including empty", () => {
    expect(parseTextFilterValue("ana")).toBe("ana");
    expect(parseTextFilterValue("")).toBe("");
  });

  it("rejects missing and non-string values", () => {
    expect(parseTextFilterValue(undefined)).toBeUndefined();
    expect(parseTextFilterValue(null)).toBeUndefined();
    expect(parseTextFilterValue(1)).toBeUndefined();
    expect(parseTextFilterValue(true)).toBeUndefined();
  });
});

describe("parse-filter-value — number range", () => {
  it("accepts full and partial ranges", () => {
    expect(parseNumberRangeFilterValue({ min: 1, max: 9 })).toEqual({ min: 1, max: 9 });
    expect(parseNumberRangeFilterValue({ min: 2 })).toEqual({ min: 2 });
    expect(parseNumberRangeFilterValue({ max: 5 })).toEqual({ max: 5 });
    expect(parseNumberRangeFilterValue({ min: 0, max: 0 })).toEqual({ min: 0, max: 0 });
  });

  it("keeps valid bounds when the other bound is invalid", () => {
    expect(parseNumberRangeFilterValue({ min: 1, max: "x" })).toEqual({ min: 1 });
    expect(parseNumberRangeFilterValue({ min: "x", max: 9 })).toEqual({ max: 9 });
  });

  it("rejects empty, missing, null, and non-objects", () => {
    expect(parseNumberRangeFilterValue({})).toBeUndefined();
    expect(parseNumberRangeFilterValue({ min: "x", max: "y" })).toBeUndefined();
    expect(parseNumberRangeFilterValue(undefined)).toBeUndefined();
    expect(parseNumberRangeFilterValue(null)).toBeUndefined();
    expect(parseNumberRangeFilterValue([1, 9])).toBeUndefined();
    expect(parseNumberRangeFilterValue({ min: Number.NaN })).toBeUndefined();
    expect(parseNumberRangeFilterValue({ min: Number.POSITIVE_INFINITY })).toBeUndefined();
  });
});

describe("parse-filter-value — enum", () => {
  it("preserves null as the explicit all/unselected state", () => {
    expect(parseEnumFilterValue(null)).toBeNull();
  });

  it("accepts strings and rejects other values", () => {
    expect(parseEnumFilterValue("new")).toBe("new");
    expect(parseEnumFilterValue("")).toBe("");
    expect(parseEnumFilterValue(undefined)).toBeUndefined();
    expect(parseEnumFilterValue(1)).toBeUndefined();
    expect(parseEnumFilterValue(true)).toBeUndefined();
  });
});

describe("parse-filter-value — boolean", () => {
  it("preserves null as the explicit all/unselected state", () => {
    expect(parseBooleanFilterValue(null)).toBeNull();
  });

  it("accepts booleans and rejects coercible strings", () => {
    expect(parseBooleanFilterValue(true)).toBe(true);
    expect(parseBooleanFilterValue(false)).toBe(false);
    expect(parseBooleanFilterValue(undefined)).toBeUndefined();
    expect(parseBooleanFilterValue("true")).toBeUndefined();
    expect(parseBooleanFilterValue(1)).toBeUndefined();
  });
});

describe("parse-filter-value — tags", () => {
  it("accepts string arrays including empty", () => {
    expect(parseTagsFilterValue(["a", "b"])).toEqual(["a", "b"]);
    expect(parseTagsFilterValue([])).toEqual([]);
  });

  it("rejects mixed arrays, non-arrays, and null", () => {
    expect(parseTagsFilterValue(["a", 1])).toBeUndefined();
    expect(parseTagsFilterValue("a")).toBeUndefined();
    expect(parseTagsFilterValue(null)).toBeUndefined();
    expect(parseTagsFilterValue(undefined)).toBeUndefined();
  });
});

describe("parse-filter-value — date range", () => {
  it("accepts ISO date bounds", () => {
    expect(parseDateRangeFilterValue({ from: "2026-01-01", to: "2026-12-31" })).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
    expect(parseDateRangeFilterValue({ from: "2026-06-15" })).toEqual({ from: "2026-06-15" });
  });

  it("keeps valid ISO bounds when the other bound is invalid", () => {
    expect(parseDateRangeFilterValue({ from: "2026-01-01", to: "nope" })).toEqual({
      from: "2026-01-01",
    });
    expect(parseDateRangeFilterValue({ from: "not-a-date", to: "2026-12-31" })).toEqual({
      to: "2026-12-31",
    });
  });

  it("rejects empty, missing, null, non-ISO, and non-objects", () => {
    expect(parseDateRangeFilterValue({})).toBeUndefined();
    expect(parseDateRangeFilterValue({ from: "hello" })).toBeUndefined();
    expect(parseDateRangeFilterValue({ from: "" })).toBeUndefined();
    expect(parseDateRangeFilterValue({ from: "2026-01-01T12:00:00Z" })).toBeUndefined();
    expect(parseDateRangeFilterValue({ from: 1 })).toBeUndefined();
    expect(parseDateRangeFilterValue(undefined)).toBeUndefined();
    expect(parseDateRangeFilterValue(null)).toBeUndefined();
  });
});
