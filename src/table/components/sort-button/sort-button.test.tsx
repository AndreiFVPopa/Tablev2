import { describe, expect, it } from "vitest";

import { DEFAULT_LABELS } from "@table/table-labels";

import { directionGlyph, nextSortAction } from "./sort-button.helpers";

describe("sort-button pure helpers", () => {
  it("maps each sort direction to a glyph", () => {
    expect(directionGlyph(false)).toBe(" ↕");
    expect(directionGlyph("asc")).toBe(" ▲");
    expect(directionGlyph("desc")).toBe(" ▼");
  });

  it("describes the next action in the none → asc → desc → none cycle", () => {
    expect(nextSortAction(false, DEFAULT_LABELS)).toBe(DEFAULT_LABELS.sortAscending);
    expect(nextSortAction("asc", DEFAULT_LABELS)).toBe(DEFAULT_LABELS.sortDescending);
    expect(nextSortAction("desc", DEFAULT_LABELS)).toBe(DEFAULT_LABELS.sortClear);
  });
});
