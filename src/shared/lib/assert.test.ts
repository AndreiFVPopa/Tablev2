import { describe, it, expect } from "vitest";

import { assertDefined, isRecord } from "./assert";
describe("assertDefined", () => {
  it("returns the value when defined", () => {
    expect(assertDefined(1, "x")).toBe(1);
    expect(assertDefined("a", "x")).toBe("a");
  });
  it("throws when nullish", () => {
    expect(() => assertDefined(null, "oops")).toThrow("oops");
    expect(() => {
      assertDefined(undefined, "oops");
    }).toThrow("oops");
  });
});
describe("isRecord", () => {
  it("accepts plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });
  it("rejects arrays, null, and primitives", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(1)).toBe(false);
    expect(isRecord("x")).toBe(false);
  });
});
