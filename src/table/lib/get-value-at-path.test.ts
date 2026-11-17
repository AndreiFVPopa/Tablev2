import { describe, expect, it } from "vitest";

import { getValueAtPath } from "./get-value-at-path";

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

  it("returns undefined for null / undefined / primitive midway segments", () => {
    expect(getValueAtPath({ a: null }, ["a", "b"])).toBeUndefined();
    expect(getValueAtPath({ a: undefined }, ["a", "b"])).toBeUndefined();
    expect(getValueAtPath({ a: 5 }, ["a", "b"])).toBeUndefined();
    expect(getValueAtPath({ a: "text" }, ["a", "b"])).toBeUndefined();
  });

  it("does not descend into arrays", () => {
    expect(getValueAtPath({ tags: ["x"] }, ["tags", "0"])).toBeUndefined();
  });

  it("returns the root for an empty path", () => {
    expect(getValueAtPath(row, [])).toBe(row);
    expect(getValueAtPath(null, [])).toBeNull();
    expect(getValueAtPath(42, [])).toBe(42);
  });

  it("returns undefined when the row itself is not a plain object", () => {
    expect(getValueAtPath(null, ["a"])).toBeUndefined();
    expect(getValueAtPath(undefined, ["a"])).toBeUndefined();
    expect(getValueAtPath(["a"], ["0"])).toBeUndefined();
  });
});
