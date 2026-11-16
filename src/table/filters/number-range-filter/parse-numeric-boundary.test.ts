import { describe, expect, it } from "vitest";

import { parseNumericBoundary } from "./parse-numeric-boundary";

describe("parseNumericBoundary", () => {
  it("returns undefined for blank input", () => {
    expect(parseNumericBoundary("")).toBeUndefined();
    expect(parseNumericBoundary("   ")).toBeUndefined();
  });

  it("parses finite numbers", () => {
    expect(parseNumericBoundary("12")).toBe(12);
    expect(parseNumericBoundary("3.5")).toBe(3.5);
    expect(parseNumericBoundary("-1")).toBe(-1);
  });

  it("rejects non-finite input", () => {
    expect(parseNumericBoundary("abc")).toBeUndefined();
    expect(parseNumericBoundary("Infinity")).toBeUndefined();
  });
});
