import { describe, expect, it } from "vitest";

import {
  matchBoolean,
  matchDateRange,
  matchEnum,
  matchNumberRange,
  matchTags,
  matchText,
} from "./filter-functions";
describe("matchText", () => {
  it("passes every row when the needle is empty", () => {
    expect(matchText("Ana", "")).toBe(true);
    expect(matchText(42, "")).toBe(true);
    expect(matchText(undefined, "")).toBe(true);
  });
  it("is case-insensitive substring match on strings", () => {
    expect(matchText("Andrei Popescu", "pop")).toBe(true);
    expect(matchText("Andrei Popescu", "POP")).toBe(true);
    expect(matchText("Andrei Popescu", "zzz")).toBe(false);
  });
  it("stringifies finite numbers so numeric columns are searchable too", () => {
    expect(matchText(1234, "23")).toBe(true);
    expect(matchText(Number.POSITIVE_INFINITY, "inf")).toBe(false);
  });
  it("rejects non-string, non-number cells", () => {
    expect(matchText(null, "x")).toBe(false);
    expect(matchText({ title: "x" }, "x")).toBe(false);
  });
});
describe("matchNumberRange", () => {
  it("passes every row when both bounds are missing", () => {
    expect(matchNumberRange(5, {})).toBe(true);
    expect(matchNumberRange("not a number", {})).toBe(true);
  });
  it("applies inclusive min and max", () => {
    expect(matchNumberRange(5, { min: 5 })).toBe(true);
    expect(matchNumberRange(4.9, { min: 5 })).toBe(false);
    expect(matchNumberRange(10, { max: 10 })).toBe(true);
    expect(matchNumberRange(10.1, { max: 10 })).toBe(false);
    expect(matchNumberRange(7, { min: 5, max: 10 })).toBe(true);
  });
  it("rejects non-numeric cells once any bound is set", () => {
    expect(matchNumberRange("5", { min: 0 })).toBe(false);
    expect(matchNumberRange(Number.NaN, { min: 0 })).toBe(false);
  });
});
describe("matchEnum", () => {
  it("passes every row for null or empty filter", () => {
    expect(matchEnum("a", null)).toBe(true);
    expect(matchEnum("a", "")).toBe(true);
  });
  it("requires exact equality for non-empty filter", () => {
    expect(matchEnum("a", "a")).toBe(true);
    expect(matchEnum("A", "a")).toBe(false);
  });
});
describe("matchBoolean", () => {
  it("passes every row for null", () => {
    expect(matchBoolean(true, null)).toBe(true);
    expect(matchBoolean(false, null)).toBe(true);
    expect(matchBoolean(undefined, null)).toBe(true);
  });
  it("requires exact equality otherwise", () => {
    expect(matchBoolean(true, true)).toBe(true);
    expect(matchBoolean(false, true)).toBe(false);
    expect(matchBoolean(undefined, false)).toBe(false);
  });
});
describe("matchTags", () => {
  it("passes every row for empty filter", () => {
    expect(matchTags(["a"], [])).toBe(true);
    expect(matchTags("not an array", [])).toBe(true);
  });
  it("is match-any across the selected tags", () => {
    expect(matchTags(["a", "b"], ["b", "c"])).toBe(true);
    expect(matchTags(["a"], ["b", "c"])).toBe(false);
  });
  it("rejects non-array cells when any tag is selected", () => {
    expect(matchTags(null, ["b"])).toBe(false);
  });
});
describe("matchDateRange", () => {
  const nov10 = new Date("2026-11-10T12:00:00Z");
  const nov14 = new Date("2026-11-14T12:00:00Z");
  const nov20 = new Date("2026-11-20T12:00:00Z");
  it("passes every row when both bounds are missing", () => {
    expect(matchDateRange(nov14, {})).toBe(true);
    expect(matchDateRange("not a date", {})).toBe(true);
  });
  it("applies inclusive from/to bounds against the whole 'to' day", () => {
    expect(matchDateRange(nov14, { from: "2026-11-10", to: "2026-11-20" })).toBe(true);
    expect(matchDateRange(nov10, { from: "2026-11-10" })).toBe(true);
    expect(matchDateRange(nov20, { to: "2026-11-20" })).toBe(true);
    expect(matchDateRange(nov20, { to: "2026-11-19" })).toBe(false);
  });
  it("rejects non-Date cells once any bound is set", () => {
    expect(matchDateRange("2026-11-14", { from: "2026-11-10" })).toBe(false);
    expect(matchDateRange(new Date("invalid"), { from: "2026-11-10" })).toBe(false);
  });
  it("rejects an invalid bound without matching every row", () => {
    expect(matchDateRange(nov14, { to: "not-a-date" })).toBe(false);
  });
});
