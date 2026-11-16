import { sortFn_text } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";

import { compareTextValues, normalizeTextSortValue, sortText } from "./sort-functions";

describe("sortText helpers (empty-last + localeCompare)", () => {
  it("normalizes only non-empty strings for case-insensitive compare", () => {
    expect(normalizeTextSortValue("Ana")).toBe("ana");
    expect(normalizeTextSortValue("")).toBe("");
    expect(normalizeTextSortValue(null)).toBe("");
    expect(normalizeTextSortValue(undefined)).toBe("");
    expect(normalizeTextSortValue(12)).toBe("");
  });

  it("is case-insensitive after normalization", () => {
    expect(
      compareTextValues(normalizeTextSortValue("Ana"), normalizeTextSortValue("bogdan")),
    ).toBeLessThan(0);
    expect(
      compareTextValues(normalizeTextSortValue("carla"), normalizeTextSortValue("Bogdan")),
    ).toBeGreaterThan(0);
  });

  it("pushes empty values after real strings", () => {
    expect(compareTextValues("", "ana")).toBeGreaterThan(0);
    expect(compareTextValues("ana", "")).toBeLessThan(0);
  });

  it("orders Romanian diacritics with localeCompare", () => {
    expect(compareTextValues("a", "ă")).toBeLessThan(0);
    expect(compareTextValues("bursă", "bursa")).toBeGreaterThan(0);
  });

  it("is registered through TanStack constructSortFn", () => {
    expect(typeof sortText).toBe("function");
    expect(sortText.resolveDataValue).toBe(normalizeTextSortValue);
  });

  it("keeps empty-last behavior that built-in sortFn_text does not", () => {
    const builtInEmptyFirst =
      (sortFn_text.resolveDataValue?.("") ?? "") < (sortFn_text.resolveDataValue?.("Ana") ?? "ana");
    expect(builtInEmptyFirst).toBe(true);
    expect(
      compareTextValues(normalizeTextSortValue(""), normalizeTextSortValue("Ana")),
    ).toBeGreaterThan(0);
  });
});
